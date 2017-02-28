"use strict"

var heatmap = {};


heatmap.update = function(recNode) {
    if (recNode.events.senders.length == 0) return

    var source = d3.merge(app.data.links.filter(function(link) {
        return link.target == recNode.id
    }).map(function(link) {
        return app.data.nodes[link.source].ids
    }))

    var times = recNode.events['times'];
    var senders = recNode.events['senders'].filter(function(d, i) {
        return times[i] > (app.data.kernel.time - 100)
    })
    recNode.events['senders'] = senders
    recNode.events['times'] = times.filter(function(d, i) {
        return times[i] > (app.data.kernel.time - 100)
    })

    var h1 = d3.histogram()
        .domain(d3.extent(source))
        .thresholds(source)(senders);
    var h1 = h1.map(function(d) {
        return d.length * 1
    })
    $('#clip').empty()
    var sourceId = app.data.links.find(function(x) {
        return x.target == recNode.id
    }).source
    heatmapchart.xScale.domain([0, app.data.nodes[sourceId].nrow])
    heatmapchart.yScale.domain([0, app.data.nodes[sourceId].ncol])
    heatmapchart.colorScale.domain([0, 5])
    heatmapchart.data({
            i: d3.range(0, h1.length),
            x: d3.range(0, app.data.nodes[sourceId].ncol),
            y: d3.range(0, app.data.nodes[sourceId].nrow),
            c: h1,
        })
        .update();

    $('#simulation-add').attr('disabled', false)
    $('#simulation-resume').attr('disabled', false)
}

heatmap.init = function(recNode, noutputs, cidx) {

    // $('#chart').empty()
    var height = parseInt($('#chart').attr('height')) / noutputs
    var heatmapchart = app.chart.heatmapChart('#chart',  {
        y: height * cidx,
        height: height,
    });
    heatmap.chart = heatmapchart;
    heatmapchart.xAxis(heatmapchart.xScale)
        .yAxis(heatmapchart.yScale)
        .xLabel('Neuron Row ID')
        .yLabel('Neuron Col ID');
}

module.exports = heatmap;
