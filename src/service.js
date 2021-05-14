
module.exports = records => {
    return {
        getRequestHandler: getRequestHandler(records),
        releaseLock: releaseLock(records),
        updateOrderBook: updateOrderBook(records),
    };
};

const updateOrderBook = records => (match, order) => {
    if (match.amount > records[order._id].amount) {
        records[match._id] = {
            ...records[match._id],
            amount: records[match._id].amount - records[order._id].amount,
            lock: 0,
            recipient: undefined,
        };

        delete records[order._id];
    } else if (match.amount === records[order._id].amount) {
        delete records[order._id];
        delete records[match._id];
    } else {
        records[order._id] = {
            ...records[order._id],
            amount: records[order._id].amount - records[match._id].amount,
            lock: 0,
            recipient: undefined,
        }

        delete records[match._id];
    }
    return { updatedMatch: records[match._id], updatedRequest: records[order._id] };
};

const sanitizeOrders = ({ match, order, updatedMatch, updatedRequest }, records) => {
    if (!updatedRequest) delete records[order._id];
    if (updatedRequest) records[order._id] = updatedRequest;
    if (updatedMatch) records[match._id] = updatedMatch;
    if (!updatedMatch) delete records[match._id];

};

const releaseLock = (records) => (order) => {
    records[order._id].recipient = null;
    records[order._id].lock = 0;
};

const getRequestHandler = (records) => (payload, responder) => {
    const requestHandler = {
        'FETCH_RECORD': function () {
            return responder(null, { records });;
        },
        'FIRST_ORDER': function () {
            records[payload.data._id] = payload.data
            return;
        },
        'LOCK_STATE': function () {
            if (records[payload.data._id].lock) {
                responder(null, { success: false });
                return;
            }
            records[payload.data._id].lock = 1;
            records[payload.data._id].recipient = payload.data.recipient;
            responder(null, { success: true });
            return;
        },
        'UPDATE_RECORD': function () {
            sanitizeOrders(payload.data, records);
            console.log('records state is, ', records);
            return;
        },
        'CONFIRM_TRANSACTION': function () {
            return responder(null, { success: records[payload.data.orderId].recipient === records[payload.data.matchedId].recipient });
        },
        'ROLL_BACK': function () {

        },
        'DEFAULT': function () {
            return console.log('Hey the requested action is invalid');
        }
    }
    console.log(payload.action);
    return (requestHandler[payload.action] || requestHandler['DEFAULT'])();
};
