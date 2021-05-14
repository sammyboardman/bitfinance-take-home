
const { orderTypes } = require('./order-model');
const { pushPayloadToClient } = require('./lib');
const constants = require('./constants');

const getMatch = (order, records) => {
    const requiredMatch = orderTypes.requiredMatch(order.type);

    let bestMatch = {
        amount: Number.POSITIVE_INFINITY
    };

    for (let key in records) {
        if (
            records[key].issuer === order.issuer ||
            records[key].lock ||
            records[key].type !== requiredMatch) {
            continue;
        }
        if (Math.abs(records[key].amount - order.amount)
            < Math.abs(bestMatch.amount - order.amount)) {
            bestMatch = { ...records[key] };
        }
    }
    return bestMatch && Number.POSITIVE_INFINITY !== bestMatch.amount;
};


module.exports = (records = {}, issuer = 0) => {
    const service = require('./service')(records);

    return async (order, peerClient) => {
        records[order._id] = order;

        const pushPayload = pushPayloadToClient(peerClient);

        await pushPayload({ action: constants.FIRST_ORDER, data: order, issuer });

        const bestMatch = getMatch(order, records);
        //We need to send initial alert informing all clients to update their orderbooks with the latest order info.

        if (!bestMatch) {
            console.log('We did not get a Match, total records is::', records);
            service.releaseLock(order);
            return;
        }
        // if the locked order here has already been put in a locked state by another client. Release this match and retry the matcher.
        await pushPayload({ action: constants.LOCK_STATE, data: { ...bestMatch, recipient: order.issuer }, issuer });

        await pushPayload({ action: constants.CONFIRM_TRANSACTION, data: { orderId: order._id, matchedId: bestMatch._id }, issuer });

        const { updatedMatch, updatedRequest } = service.updateOrderBook(bestMatch, order);

        await pushPayload({
            issuer,
            action: constants.UPDATE_RECORD,
            data: {
                bestMatch,
                order,
                updatedMatch,
                updatedRequest
            },
        });

        console.log(records);
    };
};