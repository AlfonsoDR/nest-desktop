"use strict"

var controller = {
    simulation: require('./controller/simulation'),
    kernel: require('./controller/kernel'),
    node: require('./controller/node'),
    connection: require('./controller/connection'),
    synapse: require('./controller/synapse'),
};

controller.initNodes = () => {
    $('#nodes .controller').empty()
    $('#nodeScrollspy .nav').empty()
    app.data.nodes.map((node) => {
        controller.node.init(node)
    })
}

controller.initLinks = () => {
    var drawing = app.chart.networkLayout.drawing;
    if (!drawing) {
        $('#connections .controller').empty();
        $('#synapses .controller').empty();
        app.data.links.map((link) => {
            if (app.data.nodes[link.source].hidden || app.data.nodes[link.target].hidden) return
            if (app.data.nodes[link.source].disabled || app.data.nodes[link.target].disabled) return
            // if (app.data.nodes[link.target].element_type == 'recorder') return
            controller.connection.init(link)
            controller.synapse.init(link)
        })
    }
    $('.hideOnDrawing').toggle(!drawing)
}

controller.update = () => {
    app.message.log('Update controller')
    controller.simulation.update()
    controller.height = window.innerHeight - $('.tab-content')[0].offsetTop - 10
    $('.tab-content').css('max-height', controller.height + 'px')

    $('.node').removeClass('active');
    $('.controller').find('.node').show()
    $('.controller').find('.link').show()
    if (app.chart.networkLayout.drawing) return

    if (app.selected_node) {
        $('.controller').find('.node').hide()
        $('.controller').find('.link').hide()
        $('.node[data-id="' + app.selected_node.id +'"]').addClass('active');
        $('.controller').find('.node[data-id="' + app.selected_node.id + '"]').show()
        $('.controller').find('.link[data-source="' + app.selected_node.id + '"]').show()
        $('.controller').find('.link[data-target="' + app.selected_node.id + '"]').show()
    }
    if (app.selected_link) {
        $('.controller').find('.link').hide()
        $('.controller').find('.link[data-id="' + app.selected_link.id + '"]').show()
    }
}

controller.init = () => {
    app.message.log('Initialize controller')
    controller.borderWidth = '4px';

    controller.simulation.init()
    controller.kernel.init()

    controller.initNodes()
    controller.initLinks()

    controller.update()
}

module.exports = controller;
