const { v4: uuid } = require('uuid');

class Order {
    constructor({ amount, units, issuer, type, }) {
        this._id = uuid();
        this.amount = amount;
        this.units = units;
        this.issuer = issuer;
        this.type = type;
        this.locked = 0;
        this.recipient = null;
        this.credit = 0
    }
}

const orderTypes = {
    sell: 'sell',
    buy: 'buy',
    requiredMatch: function (type) {
        return (type === this.sell) ? this.buy : this.sell;
    }
};

module.exports = {
    Order,
    orderTypes
};