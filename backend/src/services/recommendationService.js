class BiasedMatrixFactorization {
    constructor(numUsers, numItems, numFactors = 10, lr = 0.005, reg = 0.02, epochs = 15) {
        this.numFactors = numFactors;
        this.lr = lr;
        this.reg = reg;
        this.epochs = epochs;

        this.P = Array.from({ length: numUsers || 1 }, () => 
            Array.from({ length: numFactors }, () => (Math.random() - 0.5) * 0.1)
        );
        this.Q = Array.from({ length: numItems || 1 }, () => 
            Array.from({ length: numFactors }, () => (Math.random() - 0.5) * 0.1)
        );

        this.b_u = new Array(numUsers || 1).fill(0);
        this.b_i = new Array(numItems || 1).fill(0);
        this.mu = 0.0;
    }

    _dotProduct(vecA, vecB) {
        if (!vecA || !vecB) return 0;
        return vecA.reduce((sum, val, i) => sum + val * (vecB[i] || 0), 0);
    }

    fit(trainData) {
        if (!trainData || trainData.length === 0) return;

        const sumRatings = trainData.reduce((sum, item) => sum + item.r, 0);
        this.mu = sumRatings / trainData.length;

        for (let epoch = 0; epoch < this.epochs; epoch++) {
            trainData.sort(() => Math.random() - 0.5);

            for (const data of trainData) {
                const { u, i, r } = data;

                if (!this.P[u] || !this.Q[i]) continue;

                const pred = this.mu + this.b_u[u] + this.b_i[i] + this._dotProduct(this.P[u], this.Q[i]);
                const error = r - pred;

                this.b_u[u] += this.lr * (error - this.reg * this.b_u[u]);
                this.b_i[i] += this.lr * (error - this.reg * this.b_i[i]);

                const P_u_old = [...this.P[u]];
                for (let f = 0; f < this.numFactors; f++) {
                    this.P[u][f] += this.lr * (error * this.Q[i][f] - this.reg * this.P[u][f]);
                    this.Q[i][f] += this.lr * (error * P_u_old[f] - this.reg * this.Q[i][f]);
                }
            }
        }
    }

    predict(u, i) {
        if (!this.P[u] || !this.Q[i]) return this.mu;
        return this.mu + this.b_u[u] + this.b_i[i] + this._dotProduct(this.P[u], this.Q[i]);
    }
}

async function getRecommendationsForUser(targetUserId, allInteractions = [], allAttendees = [], allEvents = []) {
    const interactionMap = new Map();

    if (Array.isArray(allInteractions)) {
        allInteractions.forEach(row => {
            const u = row.user || row.userId;
            const e = row.event || row.eventId;
            if (u && e) {
                let score = 3; 
                if (parseInt(row.interested || row.isInterested) === 1) score = 4;
                if (parseInt(row.not_interested || row.notInterested) === 1) score = 1;
                interactionMap.set(`${u}_${e}`, score);
            }
        });
    }

    if (Array.isArray(allAttendees)) {
        allAttendees.forEach(row => {
            if (row.status === 'yes' || row.status === 'CONFIRMED') {
                const uId = row.attendeeId || row.user_id || row.userId;
                const eId = row.eventId || row.event;
                if (uId && eId) {
                    interactionMap.set(`${uId}_${eId}`, 5); // Σκορ 5 για κράτηση
                }
            }
        });
    }

    const uniqueUsers = Array.from(new Set([
        ...(Array.isArray(allInteractions) ? allInteractions.map(i => i.user || i.userId) : []), 
        ...(Array.isArray(allAttendees) ? allAttendees.map(a => a.attendeeId || a.user_id || a.userId) : [])
    ].filter(Boolean))).map(id => id.toString());

    const uniqueEvents = Array.from(new Set([
        ...(Array.isArray(allInteractions) ? allInteractions.map(i => i.event || i.eventId) : []), 
        ...(Array.isArray(allAttendees) ? allAttendees.map(a => a.eventId || a.event) : []),
        ...allEvents.map(e => e.id || e.event_id)
    ].filter(Boolean))).map(id => id.toString());

    if (!uniqueUsers.includes(targetUserId.toString()) || interactionMap.size < 2) {
        const counts = {};
        if (Array.isArray(allAttendees)) {
            allAttendees.forEach(a => {
                if (a.status === 'yes' || a.status === 'CONFIRMED') {
                    const eId = a.eventId || a.event;
                    if (eId) counts[eId] = (counts[eId] || 0) + 1;
                }
            });
        }
        
        let popularEvents = Object.keys(counts)
            .sort((a, b) => counts[b] - counts[a])
            .slice(0, 5);
            
        if (popularEvents.length === 0) {
            return allEvents.slice(0, 5);
        }
            
        return allEvents.filter(e => popularEvents.includes((e.id || e.event_id || '').toString()));
    }

    const userToIdx = new Map(uniqueUsers.map((id, idx) => [id, idx]));
    const eventToIdx = new Map(uniqueEvents.map((id, idx) => [id, idx]));

    const trainSet = [];
    interactionMap.forEach((score, key) => {
        const [uId, eId] = key.split('_');
        if (userToIdx.has(uId) && eventToIdx.has(eId)) {
            trainSet.push({ u: userToIdx.get(uId), i: eventToIdx.get(eId), r: score });
        }
    });

    const model = new BiasedMatrixFactorization(uniqueUsers.length, uniqueEvents.length, 10, 0.005, 0.02, 15);
    if (trainSet.length > 0) {
        model.fit(trainSet);
    }

    const targetUserIdx = userToIdx.get(targetUserId.toString());
    const recommendations = [];

    eventToIdx.forEach((eIdx, eId) => {
        const hasInteracted = interactionMap.has(`${targetUserId}_${eId}`);
        if (!hasInteracted) {
            const predScore = model.predict(targetUserIdx, eIdx);
            recommendations.push({ eventId: eId, score: predScore });
        }
    });

    recommendations.sort((a, b) => b.score - a.score);
    const top5Ids = recommendations.slice(0, 5).map(r => r.eventId);

    return allEvents.filter(e => {
        const id = e.id || e.event_id;
        return top5Ids.includes(id?.toString());
    });
}

module.exports = { getRecommendationsForUser };