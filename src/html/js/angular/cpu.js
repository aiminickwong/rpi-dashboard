/*  Raspberry Pi Dasboard
 *  =====================
 *  Copyright 2014 Domen Ipavec <domen.ipavec@z-v.si>
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

registerPage('/cpu', {
    templateUrl: 'partials/cpu.html',
    controller: 'CpuController'
}, ['cpu'], "CPU");

cpuData = {};

cpuData.usage = {
    user: vObject(0),
    system: vObject(0),
    iowait: vObject(0)
};
cpuData.temperature = vObject(0);
cpuData.usageFetchFormat = {
    rate: true, 
    format: [
        {
            key: ['total'],
            rate: true
        },
        {
            key: ['busy'],
            rate: true
        },
        {
            key: ['user'],
            rate: true
        },
        {
            key: ['iowait'],
            rate: true
        }
    ]
};
cpuData.usageVAxis = {
    ticks: [{v: 0, f: procentsFilter(0)}, {v: 0.5, f: procentsFilter(0.5)}, {v: 1, f: procentsFilter(1)}]
};
cpuData.usageGraph = {
    type: "ColumnChart",
    data: {
        cols: [
            {
                id: "cpu",
                type: "string"
            },
            {
                id: "user",
                label: "User processes",
                type: "number"
            },
            {
                id: "system",
                label: "System",
                type: "number"
            },
            {
                id: "iowait",
                label: "I/O wait",
                type: "number"
            }
        ],
        rows: [
            cObject([
                vObject("Cpu"),
                cpuData.usage.user,
                cpuData.usage.system,
                cpuData.usage.iowait
            ])
        ]
    },
    options: {
        isStacked: true,
        backgroundColor: {fill: 'transparent'},
        vAxis: cpuData.usageVAxis,
        legend: 'none',
        chartArea: {top: 10, width: "50%", height: "85%"},
        colors: ['#dc3912', '#ff9900', '#3366cc']
    }
};
cpuData.usageHistory = {
    type: "AreaChart",
    data: {
        cols: [
            {
                id: "time",
                label: "Time",
                type: "datetime"
            },
            {
                id: "user",
                label: "User processes",
                type: "number"
            },
            {
                id: "system",
                label: "System",
                type: "number"
            },
            {
                id: "iowait",
                label: "I/O wait",
                type: "number"
            }
        ],
        rows: []
    },
    options: {
        backgroundColor: {fill: 'transparent'},
        isStacked: true,
        legend: 'none',
        colors: ['#dc3912', '#ff9900', '#3366cc'],
        vAxis: cpuData.usageVAxis,
        chartArea: {top: 10, width: '75%', height: '85%'},
        lineWidth: 1
    }
};
cpuData.temperatureGauge = {
    type: "Gauge",
    data: {
        cols: [
            {
                id: "temperature",
                label: "°C",
                type: "number"
            }
        ],
        rows: [
            cObject([
                cpuData.temperature
            ])
        ]
    },
    options: {
        backgroundColor: {fill: 'transparent'},
        min: 0,
        max: 100,
        redFrom: 75,
        redTo: 100,
        yellowFrom: 60,
        yellowTo: 75,
        minorTicks: 5,
        majorTicks: [0,25,50,75,100]
    }
};
cpuData.temperatureHistory = {
    type: "LineChart",
    data: {
        cols: [
            {
                id: "time",
                label: "Time",
                type: "datetime"
            },
            {
                id: "temperature",
                label: "Temperature",
                type: "number"
            }
        ],
        rows: []
    },
    options: {
        backgroundColor: {fill: 'transparent'},
        legend: 'none',
        chartArea: {top: 10, width: '75%', height: '85%'},
        vAxis: {
            ticks: [
                {v: 0, f: "0°C"},
                {v: 25, f: "25°C"},
                {v: 50, f: "50°C"},
                {v: 75, f: "75°C"},
                {v: 100, f: "100°C"}
            ]
        }
    }
};

backgroundUpdate(['cpu'], 1000, function(done) {
    $.rpijs.get("cpu/usage", function(data) {
        cpuData.usage.user.v = data.user/data.total;
        cpuData.usage.user.f = procentsFilter(cpuData.usage.user.v);
        cpuData.usage.system.v = (data.busy - data.user)/data.total;
        cpuData.usage.system.f = procentsFilter(cpuData.usage.system.v);
        cpuData.usage.iowait.v = data.iowait/data.total;
        cpuData.usage.iowait.f = procentsFilter(cpuData.usage.iowait.v);
        cpuData.usageHistory.data.rows.push(cObject([
            vObject(new Date()),
            angular.copy(cpuData.usage.user),
            angular.copy(cpuData.usage.system),
            angular.copy(cpuData.usage.iowait)
        ]));
        
        $.rpijs.get("cpu/temperature", function(data) {
            cpuData.temperature.v = data;
            cpuData.temperature.f = data.toFixed(1) + "°C";
            cpuData.temperatureHistory.data.rows.push(cObject([
                vObject(new Date()),
                angular.copy(cpuData.temperature)
            ]));
            done.resolve();
        });
    }, cpuData.usageFetchFormat);
});

rpiDashboard.controller('CpuController', function($scope, $timeout) {
    var updateUptime = function() {
        $scope.uptime++;
        updateUptime.timeout = $timeout(updateUptime, 1000);
    };
    $.rpijs.get("cpu/uptime", function(msg) {
        $scope.$apply(function() {
            $scope.uptime = msg - 1;
        });
        updateUptime();
    });
    
    $scope.usage = cpuData.usage;
    $scope.usageGraph = cpuData.usageGraph;
    $scope.usageHistory = cpuData.usageHistory;
    
    $scope.temperatureGauge = cpuData.temperatureGauge;
    $scope.temperatureHistory = cpuData.temperatureHistory;
    
    $scope.$on('$destroy', function() {
        $timeout.cancel(updateUptime.timeout);
    });
});