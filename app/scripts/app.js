function ProgressBar(el) {
  this.el = el;
  this.divEl = $('<div>')
    .appendTo(this.el);
  this.setPercent(0);
}

ProgressBar.prototype.setPercent = function (value) {
  this.percent = value;
  this.divEl.width(this.percent + '%');
}

function dateToString(date) {
  return timeToString(date.getHours(), date.getMinutes());
}

/**
 * Converts a number of seconds to "xxH yymn"
 * @param {number} seconds 
 */
function secondsToString(seconds) {
  const hours = parseInt(seconds / 3600);
  const minutes = parseInt((seconds % 3600) / 60);
  return timeToString(hours, minutes);
}

/**
 * Converts a number of minutes to "xxH yymn"
 * @param {number} minutes 
 */
function minutesToString(minutes) {
  const isNegative = (minutes < 0);
  if (isNegative) {
    return "00:00";
  }
  const hours = parseInt(minutes / 60);
  minutes = minutes % 60;
  return timeToString(hours, minutes);
}

/**
 * Convert the specified time to string
 * @param {number} hours 
 * @param {number} minutes 
 */
function timeToString(hours, minutes) {
  let time = '';

  if (hours < 10) hours = '0' + hours;
  if (minutes < 10) minutes = '0' + minutes;

  time = hours + ':' + minutes;
  return time;
}

/**
 * Strip timestamp to minute
 * @param {number} timestamp 
 * @param {number} minutes 
 */
function stripTimestamp(timestamp, minutes) {
  if (!minutes) minutes = 1;
  return timestamp - timestamp % (minutes * 60000);
}

/**
 * Shift time
 * @param {number} timestamp 
 * @param {number} hours 
 */
function shiftTime(timestamp, hours) {
  return timestamp + hours * 3600000;
}

function stringToMinutes(str) {
  if (str.length != 5) {
    return null;
  }
  var hours = parseInt(str.substr(0, 2));
  var minutes = parseInt(str.substr(3, 2));
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function stringToTimestamp(str) {
  var minutes = stringToMinutes(str);
  if (!minutes) {
    return null;
  }
  var ts = Date.now();
  ts = ts - (ts % 86400000) + // start of the day timestamp
    - 1 * 3600000 + minutes * 60000;
  // console.log(new Date(ts));
  return ts;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * 
 * @param {object} config 
 */
function ComputerTime(config) {
  if (!config) {
    config = {};
  }

  this.computer_name = config.computer_name || 'Poste';
  this.setStartTime(config.startTime || Date.now());
  if (config.endTime) {
    this.setEndTime(config.endTime);
  } else if (config.reservedTime) {
    this.setReservedTime(config.reservedTime);
  }
  this.stopTime = null;

  this.paidAmount = config.paidAmount || 0;
  this.dueAmount = config.dueAmount || 0;
  if (config.quartersPrices) {
    this.quartersPrices = config.quartersPrices;
  } else {
    this.quartersPrices = [0.0, 0.300, 0.500, 0.800, 1.000];
  }
  this.setCurrentTime(config.currentTime || this.startTime);
};

/**
 * Set start time
 * @param {number} startTimestamp timestamp of start time in ms
 */
ComputerTime.prototype.setStartTime = function (startTimestamp) {
  this.startTime = stripTimestamp(startTimestamp);
  this.setReservedTime(this.reservedTime);
};

/**
 * Set end time
 * @param {number} endTimestamp timestamp of end time in ms
 */
ComputerTime.prototype.setEndTime = function (endTimestamp) {
  this.endTime = stripTimestamp(endTimestamp);
  this.reservedTime = Math.floor((this.endTime - this.startTime) / 60000);
};

/**
 * Set reserved time in minutes.
 * @param {number} reservedTime time in minutes
 */
ComputerTime.prototype.setReservedTime = function (reservedTime) {
  if (!reservedTime) {
    return;
  }
  this.reservedTime = reservedTime;
  this.endTime = this.startTime + reservedTime * 60000;
};

/**
 * Set the amount paid by customer
 * @param {number} paidAmount 
 */
ComputerTime.prototype.setPaidAmount = function (paidAmount) {
  this.paidAmount = paidAmount;
};

/**
 * Set the due amount 
 * @param {number} dueAmount 
 */
ComputerTime.prototype.setDueAmount = function (dueAmount) {
  this.dueAmount = dueAmount;
};

/**
 * Set the current timestamp in ms and calculate the elapsed time and the remaining time
 * @param {number} currTimestamp 
 */
ComputerTime.prototype.setCurrentTime = function (currTimestamp) {
  var currentTime = (currTimestamp > this.startTime) ? currTimestamp : this.startTime;
  currentTime = (this.stopTime && currentTime > this.stopTime) ? this.stopTime : currentTime;
  this.currentTime = currTimestamp;
  this.elapsedTime = Math.floor((currentTime - this.startTime) / 60000);
  this.remainTime = Math.ceil((this.endTime - currentTime) / 60000);
  this.calcServicePrice();
}

/**
 * Set the stop time
 */
ComputerTime.prototype.setStopTime = function (stopTime) {
  this.stopTime = stopTime;
  this.setCurrentTime(stopTime);
}

ComputerTime.prototype.calcServicePrice = function () {
  var quarters = Math.round(this.elapsedTime / 15);
  var hours = Math.floor(quarters / 4);
  quarters = quarters % 4;
  this.servicePrice = hours * this.quartersPrices[4] + this.quartersPrices[quarters];
  this.dueAmount = this.servicePrice - this.paidAmount;
};

ComputerTime.prototype.getStartTimeAsString = function () {
  return dateToString(new Date(this.startTime));
};

ComputerTime.prototype.getEndTimeAsString = function () {
  return dateToString(new Date(this.endTime));
};

ComputerTime.prototype.isPaid = function () {
  return this.dueAmount <= 0.0;
};

ComputerTime.prototype.isTimeStopped = function() {
  return this.stopTime != null;
};

ComputerTime.prototype.getProgressPercent = function () {
  var percent = this.elapsedTime / this.reservedTime * 100;
  if (percent > 100) {
    return 100;
  }
  if (percent < 0) {
    return 0;
  }
  return percent;
};