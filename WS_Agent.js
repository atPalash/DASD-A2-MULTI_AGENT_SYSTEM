/**
 * Created by halder on 09-Apr-17.
 */
var WS_Agent = function WS_Agent(name, capability) {
    this.name_ = name;
    this.capability_ = capability;
};

WS_Agent.prototype.getName = function () {
    return this.name_;
};

WS_Agent.prototype.getCapability = function () {
    return this.capability_;
};

module.exports = WS_Agent;