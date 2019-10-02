// set up SVG for D3
var width  = 2000,
    height = 850,
    colors = function(){ return "#FFF";};

var svg = d3.select('#graphDiv')
  .append('svg')
  .attr('width', width)
  .attr('height', height)
    .on("mouseover", function(d,i) {
        if (!$("#termsearch").is(':focus')) {
            d3.select(window).on('keydown', keydown).on('keyup', keyup);
        }
    })
    .on("mouseout", function(d,i) {
    d3.select(window).on('keydown', null).on('keyup', null);
    })
    .on("dblclick", function(d,i) {
        svg.classed('active', true);
        if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;
          var point = d3.mouse(this),
              node = {id: getRandomTerm(), reflexive: false};
          node.x = point[0];
          node.y = point[1];
          // selected_node = node
          nodes.push(node);
          restart();
    })
    .on('contextmenu', function(){
        d3.event.preventDefault();
    })
    // TODO: click on svg -> unselect all nodes & links
;

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - links are always source < target; edge directions are set by 'left' and 'right'.
var nodes = [],
  links = [];

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(150)
    .charge(-700)
    .on('tick', tick);

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#252525');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#252525');

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    rect = svg.append('svg:g').selectAll('g');

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null,
    last_node = null;

function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
}


// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', function(d) {
    var deltaX = d.target.x - d.source.x,
        deltaY = d.target.y - d.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = d.left ? 17 : 12,
        targetPadding = d.right ? 17 : 12,
        sourceX = d.source.x + (sourcePadding * normX),
        sourceY = d.source.y + (sourcePadding * normY),
        targetX = d.target.x - (targetPadding * normX),
        targetY = d.target.y - (targetPadding * normY);
    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  });

  rect.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);
  // update existing links
  path.classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .style('stroke', function(d) {
        if (d.relation === "syno"){
            return "#a37c27";
        }
        else if (d.relation === "anto"){
            return "#a7414a";
        }
        else if (d.relation === "hyper"){
            return "#6a8a82";
        }
        else if (d.relation === "hypo"){
            return "#74593d";
        }
        else if (d.relation === "cohypo"){
            return "#54678f";
        }
        else if (d.relation === "mero"){
            return "#563838";
        }
        else if (d.relation === "holo"){
            return "#595775";
        }
        else if (d.relation === "tropo"){
            return "#516b4e";
        }
        else {
            return "#afafaf";
        }
    });

  // add new links
  path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .on('contextmenu', d3.contextMenu(menuLink))
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select link
      mousedown_link = d;
      selected_link = mousedown_link;
      selected_node = null;
      restart();
    });

  // remove old links
  path.exit().remove();

  // rect (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  rect = rect.data(nodes, function(d) { return d.id; });

  // update existing nodes (reflexive & selected visual states)
  rect.selectAll('rect')
    .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).darker().toString() : colors(d.id); })
    .classed('reflexive', function(d) { return d.reflexive; });

  // add new nodes
  var g = rect.enter().append('svg:g');

  g.append('svg:rect')
    .attr('class', 'node')
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("y", -9.5)
    .attr("height", 20)
    .style('stroke', function(d) {return '#afafaf'})
    .style('stroke-width', function(d) {return 2})
    .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
    .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
    .classed('reflexive', function(d) { return d.reflexive; })
    .on('mouseover', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select node
      mousedown_node = d;
      // if(mousedown_node === selected_node) selected_node = null;
      // else selected_node = mousedown_node;
      selected_node = mousedown_node;
      selected_link = null;
      addAnalogy(selected_node.id);
      // reposition drag line
      drag_line
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);
      restart();
    })
    .on('mouseup', function(d) {
      if(!mousedown_node) return;

      // needed by FF
      drag_line
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseup_node = d;
      if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      addNewLink();
      restart();
    })
    .on('contextmenu', d3.contextMenu(menuNode));

  // show node IDs
  g.append('svg:text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text(function(d) { return d.id; });

  g.selectAll('rect')
      .attr("width", function(d) {return this.parentNode.getBBox().width+8;})
      .attr("x", function(d) {return (this.parentNode.getBBox().width)/(-2.95);})
      .attr("y", function(d) {return (this.parentNode.getBBox().height)/(-1.8);});

  last_node = nodes[nodes.length - 1];

  // remove old rects
  rect.exit().remove();

  // set the graph in motion
  force.start();
}

function addNewLink(){
  // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      var source, target, direction;
      source = mousedown_node;
      target = mouseup_node;
      direction = 'right';
      var link;
      link = links.filter(function(l) {
        return (l.source === source && l.target === target);
      })[0];
      if(link) {
        link[direction] = true;
      } else {
        link = {source: source, target: target, relation: "none", left: false, right: false};
        link[direction] = true;

        links.push(link);
      }
      // select new link
      selected_link = link;
      selected_node = null;
}

function mousedown() {
  svg.classed('active', true);
}


function mousemove() {
  if(!mousedown_node) return;

  // update drag line
  drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

  restart();
}


function mouseup() {
  if(mousedown_node) {
    // hide drag line
    drag_line
      .classed('hidden', true)
      .style('marker-end', '');
  }

  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}


function spliceLinksForNode(node) {
  var toSplice = links.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}


// only respond once per keydown
var lastKeyDown = -1;


function keydown() {
  d3.event.preventDefault();

  if(lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if(d3.event.keyCode === 17) {
    rect.call(force.drag);
    svg.classed('ctrl', true);
  }

  if(!selected_node && !selected_link) return;
  switch(d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if(selected_node) {
        nodes.splice(nodes.indexOf(selected_node), 1);
        spliceLinksForNode(selected_node);
      } else if(selected_link) {
        links.splice(links.indexOf(selected_link), 1);
      }
      selected_link = null;
      selected_node = null;
      restart();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if(d3.event.keyCode === 17) {
    rect
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }
}


// app starts here
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);

restart();

