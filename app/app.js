'use strict';

// Declare app level module which depends on views, and components
angular.module('app', [
    'ngRoute', 'angularMoment'
])
    .config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
        $locationProvider.hashPrefix('!');

        $routeProvider.otherwise({redirectTo: '/'});
    }])
    .constant('TS_FORMAT', 'YYYY-MM-DD HH:mm:ss.S')
    .component('chart', {
        templateUrl: 'chart.html',
        // bindings: {
        //     data: '<'
        // },
        controller: ChartController,
        controllerAs: 'ctrl'
    });

ChartController.$inject = ['$http', 'moment', 'TS_FORMAT'];
function ChartController($http, moment, TS_FORMAT) {
    let self = this;

    $http.get('testJob.json').then(function (response) {
        getData(response.data);
        plotChart();
    });

    function getData(data) {
        console.log(data.length);
        self.data = [];
        for (let i = 0; i < data.length; i++) {
            let job = data[i];

            self.data.push({
                name: job.jobname,
                start: job.runstarttimestamp,
                end: job.runendtimestamp,
                fact: job.runmajorstatus == 'FIN' ?
                    moment.duration(moment(job.runendtimestamp, TS_FORMAT).diff(moment(job.runstarttimestamp, TS_FORMAT)))
                        .asMinutes() :
                    moment.duration(moment().diff(moment(job.runstarttimestamp, TS_FORMAT)))
                        .asMinutes(),
                result: job.runmajorstatus,
                state: job.runminorstatus
            });
        }
    }

    function plotChart() {
        let jobData = self.data;
        let margin = {top: 20, right: 0, bottom: 40, left: 50};
        let width = 800 - margin.left - margin.right;
        let height = 600 - margin.top - margin.bottom;

        let ysc = d3.scale.linear()
            .domain([0, d3.max(jobData, function (d) {
                return d.fact
            })])
            .range([height, 0]);
        // let xsc = d3.scale.ordinal().domain().rangeRoundBands([0, width], .15);

        let chart = d3.select('.job-chart')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g').attr('class', 'inner-chart')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        let barWidth = (width / jobData.length);

        let bar = chart.selectAll('.bar')
            .data(jobData)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', function (d, i) {
                return i * barWidth
            })
            .attr('y', function (d) {
                return ysc(d.fact)
            })
            .attr('height', function (d) {
                return height - ysc(d.fact)
            })
            .attr('width', barWidth - 3);
    }

}