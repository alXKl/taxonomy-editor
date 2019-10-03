var analogies = [];
var annotations = [];

var precisions = {
    "syno": [0,0], "anto": [0,0], "hyper": [0,0], "hypo": [0,0],
    "cohypo": [0,0], "mero": [0,0], "holo": [0,0], "tropo": [0,0]
};


function myAlert(msg){
    $('#modalMsg').text(msg);
    $("#modalDialog").modal({backdrop: false});
    $('#modalDialog').modal('show');
}

function clearcanvas(){
    selected_node = null;
    selected_link = null;
    nodes.length = 0;
    links.length = 0;
    analogies.length = 0;
    restart();
}

function menuNodeAction(relation){
    var term = selected_node.id;
    var count = document.getElementById("resultCounter").value;
	$.ajax({
		url: '/relationnode',
		type: 'POST',
		data:{relation: relation, term: term, count: count},
		dataType: "json",
		success: function(response){
            showNodeResult(response, relation);
		},
		error: function(error){
			console.log(error);
		}
	});
}

function menuNodeAnalogy(){
    if(analogies.length > 2){
        var term1 = analogies[0];
        var term2 = analogies[1];
        var term3 = analogies[2];
        var count = document.getElementById("resultCounter").value;
        if(term1 !== term2 && term1 !== term3 && term2 !== term3){
            $.ajax({
            url: '/analogies',
            type: 'POST',
            data:{term1: term1, term2: term2, term3: term3, count: count},
            dataType: "json",
            success: function(response){
                showNodeResult(response, "AN");
            },
            error: function(error){
                console.log(error);
            }
            });
        }
        else{
            myAlert('Please select three subsequently different terms.')
        }
    }
    else{
        myAlert('Please select more terms.')
    }
}

function menuLinkAction(){
    var source = selected_link.source.id;
    var target = selected_link.target.id;
    console.log(source);
    console.log(target);
	$.ajax({
		url: '/relationlink',
		type: 'POST',
		data:{source: source, target: target},
		dataType: "json",
		success: function(response){
		    showLinkResult(response);
		},
		error: function(error){
			console.log(error);
		}
	});
}

function annotate(relation, mode){
    switch(relation) {
        case 'Synonym': relation = "syno"; break;
        case 'Antonym': relation = "anto"; break;
        case 'Hypernym': relation = "hyper"; break;
        case 'Hyponym': relation = "hypo"; break;
        case 'Cohyponym': relation = "cohypo"; break;
        case 'Meronym': relation = "mero"; break;
        case 'Holonym': relation = "holo"; break;
        case 'Troponym': relation = "tropo"; break;
        default:
    }

    var source = selected_link.source.id,
        target = selected_link.target.id,
        direction = "right",
        contains = false;

    annotation = {x: source, y: target, relation: relation};
    if (annotations.some(e => e.x === source && e.y === target && e.relation === relation)) {
        contains = true;
    }
    if(!contains && mode === 'train'){
        annotations.push(annotation);
    }
    selected_link.relation = relation;

    if(relation === "syno" || relation === "anto" || relation === "cohypo"){
        selected_link[direction] = false;
    }
    else {
        selected_link[direction] = true;
    }

    selected_link = null;
    restart();
}

function trainBatch(mode){
    var batch = null;
    if(mode === 'all'){
        batch = annotations.slice(0);
        annotations.length = 0;
    }
    else {
        batch = annoSubset(mode);
    }
    console.log(batch);
    var alpha = document.getElementById("learnRate").value;
    var iterations = document.getElementById("iterations").value;
    $.ajax({
		url: '/trainbatch',
		type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({batch: batch, alpha: alpha, iterations: iterations}),
		success: function(response){
            updateAnnotationCounts();
            myAlert('Learning finished.')
		},
		error: function(error){
			console.log(error);
		}
	});
}


function showNodeResult(res, relation){
    for( index in res) {
        $('#listNode').append('<a href="#" class="list-group-item list-group-action" data-word="'+res[index].word+'"data-value="'+res[index].value+'"><p style="text-align:left;">'+res[index].word+'&nbsp;&nbsp;<span style="float:right;"> '+res[index].value+'</span></p></a>');
    }
    if(relation === 'NN' || relation === "AN"){
        $('#listNode').append('<a href="#" class="list-group-item list-group-action" style="font-weight: 400">Cancel</a>');
    }
    else{
        $('#listNode').append('<a href="#" class="list-group-item list-group-action" data-word="xkxlxu" style="font-weight: 400">No Match</a>');
    }
    $('.list-group-action').on('click', function(){
        var term = $(this).attr('data-word');
        if(term === "xkxlxu"){
            updatePrecisions(relation, 0);
            $('#listNode').empty();
        }
        else if (typeof term !== "undefined") {
            if(!termInNodes(term)){
                addNewNodeFromResult(term, relation);
                updatePrecisions(relation, 1);
                $('#listNode').empty();
            }
            else{
                myAlert('Term is already in Graph.')
            }
        }
        else {
            $('#listNode').empty();
        }
    });
}

function showLinkResult(res){
    for( index in res)
    {
        $('#listLink').append('<a href="#" class="list-group-item list-group-action" data-relation="'+res[index].relation+'"data-mse="'+res[index].mse+'"><p style="text-align:left;">'+res[index].relation+'&nbsp;&nbsp;<span style="float:right;"> '+res[index].mse+'</span></p></a>');
    }
    $('#listLink').append('<a href="#" class="list-group-item list-group-action" style="font-weight: 400">Cancel</a>');

    $('.list-group-action').on('click', function(){
        var rel= $(this).attr('data-relation');
        if (typeof rel !== "undefined") {
            annotate(rel, 'predict')
        }
        $('#listLink').empty();
  });
}

function addAnalogy(term){
    if(analogies.length > 0){
        var last = analogies[analogies.length - 1];
        if(term !== last){
            if(analogies.length > 2){
            analogies.shift()
            }
            analogies.push(term)
            }
    }
    else {
        analogies.push(term)
    }
}

function getRandomTerm(){
    var nodesData = {}, i = 0;
    nodes.forEach((element) => {
        nodesData[i] = element.id;
        i++;
    });
    $.ajax({
		url: '/random',
		type: 'POST',
        contentType: 'application/json',
        async: false,
        data: JSON.stringify(nodesData),
		success: function(response){
            term = response;
		},
		error: function(error){
			console.log(error);
		}
	});
    return term;
}

function termInNodes(term){
    var found = false;
    nodes.forEach((element) => {
    if(element.id === term){
        found = true;
    }
    });
    return found;
}

function addNewNodeFromInput(){
    var term = document.getElementById('termsearch').value;
    if(termInNodes(term)){
        myAlert('Term is already in Graph.')
    }
    else if(term !== ''){
        $.ajax({
		url: '/checkword',
		type: 'POST',
		data:{term: term},
		// dataType: "json",
		success: function(response){
            if(response === "True"){
                svg.classed('active', true);
                var node = {id: term, reflexive: false};
                node.x = 1000;
                node.y = 80;
                nodes.push(node);
                document.getElementById('termsearch').value = '';
                restart();
            }
            else{
                myAlert('Term does not exist in Embedding.');
            }
		},
		error: function(error){
			console.log(error);
		}
	});
    }
    else{
        myAlert('Please write some term.');
    }
}

function remove(){
    if(selected_node) {
        nodes.splice(nodes.indexOf(selected_node), 1);
        spliceLinksForNode(selected_node);
      } else if(selected_link) {
        links.splice(links.indexOf(selected_link), 1);
      }
      selected_link = null;
      selected_node = null;
      restart();
}

function searchKeyPress(e) {
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode === 13)
    {
        addNewNodeFromInput();
        return false;
    }
    return true;
}

function addNewNodeFromResult(term, relation){
    svg.classed('active', true);
    // insert new node at point
    var node = {id: term, reflexive: false};
    if (selected_node.x < 1000)
    {
      node.x = selected_node.x - 7;
    } else {
      node.x = selected_node.x + 7;
    }
    if (selected_node.y < 425)
    {
      node.y = selected_node.y - 7;
    } else {
      node.y = selected_node.y + 7;
    }
    nodes.push(node);
    last_node = nodes[nodes.length - 1];
    if(relation !== "NN" && relation !== "AN"){
        addNewLinkFromResult(relation);
    }
    restart();
}

function showProjection(rel){
    $.ajax({
		url: '/projection',
		type: 'POST',
        data:{relation: rel},
        dataType: "json",
		success: function(response){
		    var title = '';
            switch(rel) {
                case 'syno': title = 'Synonym'; break;
                case 'anto': title = 'Antonym'; break;
                case 'hyper': title = 'Hypernym'; break;
                case 'hypo': title = 'Hyponym'; break;
                case 'cohypo': title = 'Cohyponym'; break;
                case 'mero': title = 'Meronym'; break;
                case 'holo': title = 'Holonym'; break;
                case 'tropo': title = 'Troponym'; break;
                default:
            }
            var data = [
              {
                z: response,
                colorscale: "Greys",
                type: 'heatmap'
              }
            ];
            var layout = {
	            title: 'Δ ' + title,
                titlefont: {
                    "size": 25
                },
                height: 700,
                width: 700,
            };

            Plotly.newPlot('matDiv', data, layout, {displayModeBar: false});
            $("#modalProjections").modal("show");
		},
		error: function(error){
			console.log(error);
		}
	});
}

function addNewLinkFromResult(relation){
    // add link to graph (update if exists)
    // NB: links are strictly source < target; arrows separately specified by booleans
    var source, target, direction;

    source = selected_node;
    target = last_node;
    direction = 'right';

    var link;
    link = links.filter(function(l) {
    return (l.source === source && l.target === target);
    })[0];

    if(link) {
    link[direction] = true;
    } else {
        link = {source: source, target: target, relation: relation, left: false, right: false};
        if(relation === 'syno' || relation === 'anto' || relation === 'cohypo'){
            link[direction] = false;
        }
        else {
            link[direction] = true;
        }
        links.push(link);
        restart();
    }
}

function getNode(id){
    var node = null;
    if (nodes.some(e => e.id === id)) {
        node = e;
    }
}

function annoSubset(rel){
    result = [];
    if(annotations.length > 0){
        for(var i = annotations.length - 1; i >= 0; i--) {
            if(annotations[i].relation === rel) {
            result.push(annotations[i]);
            annotations.splice(i, 1);
            }
        }
    }
    return result
}


function resetPrecisions(){
    precisions["syno"] = [0,0];
    precisions["anto"] = [0,0];
    precisions["hyper"] = [0,0];
    precisions["hypo"] = [0,0];
    precisions["cohypo"] = [0,0];
    precisions["mero"] = [0,0];
    precisions["holo"] = [0,0];
    precisions["tropo"] = [0,0];

    if(precisions["syno"][1] == 0){document.getElementById('synobadge').innerHTML = '';}
    if(precisions["anto"][1] == 0){document.getElementById('antobadge').innerHTML = '';}
    if(precisions["hyper"][1] == 0){document.getElementById('hyperbadge').innerHTML = '';}
    if(precisions["hypo"][1] == 0){document.getElementById('hypobadge').innerHTML = '';}
    if(precisions["cohypo"][1] == 0){document.getElementById('cohypobadge').innerHTML = '';}
    if(precisions["mero"][1] == 0){document.getElementById('merobadge').innerHTML = '';}
    if(precisions["holo"][1] == 0){document.getElementById('holobadge').innerHTML = '';}
    if(precisions["tropo"][1] == 0){document.getElementById('tropobadge').innerHTML = '';}
}

function updateAnnotationCounts(){
    var all=0, syno=0, anto=0, hyper=0, hypo=0, cohypo=0, mero=0, holo=0, tropo=0;
    annotations.forEach((element) => {
        all +=1;
        switch(element.relation) {
            case 'syno': syno += 1; break;
            case 'anto': anto += 1; break;
            case 'hyper': hyper += 1; break;
            case 'hypo': hypo += 1; break;
            case 'cohypo': cohypo += 1; break;
            case 'mero': mero += 1; break;
            case 'holo': holo += 1; break;
            case 'tropo': tropo += 1; break;
            default:
        }
    });
    document.getElementById('lrnAllbadge').innerHTML = all;
    document.getElementById('lrnSynobadge').innerHTML = syno;
    document.getElementById('lrnAntobadge').innerHTML = anto;
    document.getElementById('lrnHyperbadge').innerHTML = hyper;
    document.getElementById('lrnHypobadge').innerHTML = hypo;
    document.getElementById('lrnCohypobadge').innerHTML = cohypo;
    document.getElementById('lrnMerobadge').innerHTML = mero;
    document.getElementById('lrnHolobadge').innerHTML = holo;
    document.getElementById('lrnTropobadge').innerHTML = tropo;

    if(all==0){document.getElementById('lrnAllbadge').innerHTML = '';}
    if(syno==0){document.getElementById('lrnSynobadge').innerHTML = '';}
    if(anto==0){document.getElementById('lrnAntobadge').innerHTML = '';}
    if(hyper==0){document.getElementById('lrnHyperbadge').innerHTML = '';}
    if(hypo==0){document.getElementById('lrnHypobadge').innerHTML = '';}
    if(cohypo==0){document.getElementById('lrnCohypobadge').innerHTML = '';}
    if(mero==0){document.getElementById('lrnMerobadge').innerHTML = '';}
    if(holo==0){document.getElementById('lrnHolobadge').innerHTML = '';}
    if(tropo==0){document.getElementById('lrnTropobadge').innerHTML = '';}
}

function updatePrecisions(rel, tp){
    if(rel !== "NN" && rel !== "AN"){
    precisions[rel][0] += tp;
    precisions[rel][1] += 1;
    var truePos = precisions[rel][0];
    var total = precisions[rel][1];
    if(rel === 'syno'){document.getElementById('synobadge').innerHTML = (truePos / total).toFixed(2)}
    else if(rel === 'anto'){document.getElementById('antobadge').innerHTML = (truePos / total).toFixed(2)}
    else if(rel === 'hyper'){document.getElementById('hyperbadge').innerHTML = (truePos / total).toFixed(2)}
    else if(rel === 'hypo'){document.getElementById('hypobadge').innerHTML = (truePos / total).toFixed(2)}
    else if(rel === 'cohypo'){document.getElementById('cohypobadge').innerHTML = (truePos / total).toFixed(2)}
    else if(rel === 'mero'){document.getElementById('merobadge').innerHTML = (truePos / total).toFixed(2)}
    else if(rel === 'holo'){document.getElementById('holobadge').innerHTML = (truePos / total).toFixed(2)}
    else if(rel === 'tropo'){document.getElementById('tropobadge').innerHTML = (truePos / total).toFixed(2)}
    }
}

