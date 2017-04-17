var Pallet_Agent = function Pallet_Agent(palletID, frameType, frameColor, screenType, screenColor, keyType, keyColor, status) {
    this.palletID_ = palletID;
    this.frameType_ = frameType;
    this.frameColor_ = frameColor;
    this.screenType_ = screenType;
    this.screenColor_ = screenColor;
    this.keyType_ = keyType;
    this.keyColor_ = keyColor;
    this.status_ = status;
    this.path_ = [];
};

Pallet_Agent.prototype.getFrameColor = function () {
    return this.frameColor_;
};

Pallet_Agent.prototype.getScreenColor = function () {
    return this.screenColor_;
};

Pallet_Agent.prototype.getKeyColor = function () {
    return this.keyColor_;
};

Pallet_Agent.prototype.setPath = function (path) {
    this.path_ = path;
};

module.exports = Pallet_Agent;