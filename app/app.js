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
        let margin = {top: 20, right: 0, bottom: 100, left: 50};
        let width = 800 - margin.left - margin.right;
        let height = 600 - margin.top - margin.bottom;

        let xsc = d3.scale.ordinal()
            .domain(jobData.map(function (d) {return d.start}))
            .rangeRoundBands([0, width], .15);

        let ysc = d3.scale.linear()
            .domain([0, d3.max(jobData, function (d) {
                return d.fact
            })])
            .range([height, 0]);

        let xAxis = d3.svg.axis()
            .scale(xsc).orient('bottom');
            // .tickValues(function (d) {return d});

        let chart = d3.select('.job-chart')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g').attr('class', 'inner-chart')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        chart.append('g')
            .attr('class', 'job-chart-xaxis')
            .attr('transform', `translate(0, ${height})`)
            .call(xAxis)
            .selectAll('text')
            .attr({
                x: 9, y: 0, dy: '.35em'
            })
            .attr('transform', 'rotate(90)')
        ;

        let bar = chart.selectAll('.bar')
            .data(jobData)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', function (d) {return xsc(d.start)})
            .attr('y', function (d) {return ysc(d.fact)})
            .attr('height', function (d) {
                return height - ysc(d.fact)
            })
            .attr('width', xsc.rangeBand());
    }

}