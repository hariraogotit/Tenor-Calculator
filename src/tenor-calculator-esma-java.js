/**
 * Copyright © 2019 The Derivatives Service Bureau Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
'use strict';

var MILLIS_PER_DAY = 86400000;
var MILLIS_PER_WEEK = 604800000;
/**
 *
 * @param {string} start - start date in YYYY-MM-DD format
 * @param {string} end - end date in YYYY-MM-DD format
 * @param {string} calculationMethod - default 'ESMA'
 * @param {string} endDateAdjusted - default false
 */

var  calculateTenorFromEsma = function(start, end) {
  var endDateAdjusted = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var startDate = getValidDate(start);
  var endDate = getValidDate(end);

  if (startDate >= endDate) {
    throw {
      'name': 'InvalidException',
      'message': 'Invalid Input: Expiry Date must be greater than Effective Date.'
    };
  }

  if (startDate < getValidDate('1970-01-01')) {
    throw {
      'name': 'InvalidException',
      'message': 'Illegal contract tenor.'
    };
  }

  var tenor = calculateWholeValue(startDate, endDate);
  return tenor.value < 1000 ? tenor : roundOverflow(tenor, startDate, endDate);
}

function roundMonth(start, end) {
  var previousDate = new Date(Date.UTC(end.getFullYear(), end.getMonth(), 0));
  var calcDays = end.getDate() - start.getDate();
  var calcMonths = end.getMonth() - start.getMonth() - (calcDays < 0 ? 1 : 0);
  var calcYears = end.getFullYear() - start.getFullYear();
  var adjDays = calcDays + (calcDays < 0 ? previousDate.getDate() : 0);
  var adjMonths = calcMonths + (calcMonths < 0 ? 12 : 0);
  var adjYears = calcYears - (calcMonths < 0 ? 1 : 0);
  var wholeYearMonths = adjYears * 12;
  var roundedMonths = adjDays < 15 ? 0 : 1;
  return wholeYearMonths + adjMonths + roundedMonths;
}

function roundOverflow(tenor, start, end) {
  while (tenor.value > 999) {
    switch (tenor.unit) {
      case 'DAYS':
        tenor = {
          'value': Math.round(tenor.value / 7),
          'unit': 'WEEK',
          'basis': 'Overflow Weeks'
        };
        break;

      case 'WEEK':
        tenor = {
          'value': roundMonth(start, end),
          'unit': 'MNTH',
          'basis': 'Overflow Months'
        };
        break;

      case 'MNTH':
        tenor = {
          'value': Math.round(tenor.value / 12),
          'unit': 'YEAR',
          'basis': 'Overflow Years'
        };
        break;

      default:
        throw {
          'name': 'InvalidException',
          'message': 'Invalid Input: Input Dates exceed maximum input range of 999 Years.'
        };
    }
  }

  return tenor;
}
/**
 *
 * @param {Date} start
 * @param {Date} end
 */


function calculateWholeValue(start, end) {
  if ("".concat(start.getMonth(), "-").concat(start.getDate()) === "".concat(end.getMonth(), "-").concat(end.getDate())) {
    return {
      'value': end.getFullYear() - start.getFullYear(),
      'unit': 'YEAR',
      'basis': 'Whole Years'
    };
  }

  if (start.getDate() === end.getDate()) {
    return {
      'value': end.getFullYear() * 12 + end.getMonth() + 1 - (start.getFullYear() * 12 + start.getMonth() + 1),
      'unit': 'MNTH',
      'basis': 'Whole Months'
    };
  }

  if (start.getDay() === end.getDay()) {
    return {
      'value': (end.valueOf() - start.valueOf()) / MILLIS_PER_WEEK,
      'unit': 'WEEK',
      'basis': 'Whole Weeks'
    };
  }

  return {
    'value': (end.valueOf() - start.valueOf()) / MILLIS_PER_DAY,
    'unit': 'DAYS',
    'basis': 'Whole Days'
  };
}

function getValidDate(dateStr) {
  var date = new Date("".concat(dateStr, "T00:00:00.000Z"));

  if (isNaN(date) || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw {
      'name': 'InvalidException',
      'message': "Given date:\"".concat(dateStr, "\" is not a valid Date of format YYYY-MM-DD")
    };
  }

  return date;
}
