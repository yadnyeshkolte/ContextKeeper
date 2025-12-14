const mongoose = require('mongoose');

let cachedConnection = null;

// Decision Schema
const DecisionSchema = new mongoose.Schema({
    topic: String,
    decision: String,
    reasoning: String,
    sources: Array,
    participants: Array,
    date: { type: Date, default: Date.now }
});

async function connectToDatabase() {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log('Using cached database connection');
        return cachedConnection;
    }

    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contextkeeper';

    try {
        const connection = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        cachedConnection = connection;
        console.log('New database connection established');
        return connection;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

function getDecisionModel() {
    return mongoose.models.Decision || mongoose.model('Decision', DecisionSchema);
}

module.exports = {
    connectToDatabase,
    getDecisionModel,
    mongoose
};
