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
                plan: job.planDSJob.duration ? job.planDSJob.duration : 0,
                result: job.runmajorstatus,
                state: job.runminorstatus
            });
        }
    }

    function plotChart() {

        const xAxisTickFormat = 'DD MMM';

        let jobData = self.data;
        let jobPlanData = self.data.map(function (d) {
            return {
                start: d.start,
                height: d.plan < d.fact ? d.plan : d.fact
            }
        });
        let margin = {top: 20, right: 0, bottom: 100, left: 50};
        let width = 800 - margin.left - margin.right;
        let height = 600 - margin.top - margin.bottom;

        let xsc = d3.scale.ordinal()
            .domain(jobData.map(function (d) {
                return d.start
            }))
            .rangeRoundBands([0, width], .15);

        let ysc = d3.scale.linear()
            .domain([0, d3.max(jobData, function (d) {
                return d.fact
            })])
            .range([height, 0]);

        let xAxis = d3.svg.axis()
            .scale(xsc).orient('bottom')
            .tickFormat(d => moment(d, TS_FORMAT).format(xAxisTickFormat));

        let yAxis = d3.svg.axis()
            .scale(ysc).orient('left');

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
                x: 30, y: 0, dy: '.4em', 'text-anchor': 'start'
            })
            .attr('transform', 'rotate(90)');

        chart.append('g')
            .attr('class', 'job-chart-yaxis')
            .call(yAxis);

        //TODO: Try to append both bar and bar-plan at one time with <g> element
        let bar = chart.selectAll('.bar')
            .data(jobData)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => xsc(d.start))
            .attr('y', d => ysc(d.fact))
            .attr('height', d => height - ysc(d.fact))
            .attr('width', xsc.rangeBand());

        let planBar = chart.selectAll('.bar-plan')
            .data(jobPlanData)
            .enter().append('rect')
            .attr('class', 'bar-plan')
            .attr('x', d => xsc(d.start))
            .attr('y', d => ysc(d.height))
            .attr('height', d => height - ysc(d.height))
            .attr('width', xsc.rangeBand());
    }

}