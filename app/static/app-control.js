
$(document).on('click', '.lrn-dropdown', function (e) {
  e.stopPropagation();
});


$('#clrBatch').click(function() {
    annotations.length = 0;
    updateAnnotationCounts();
});

$('#resetMat').click(function() {
    $.ajax({
		url: '/resetmat',
		type: 'POST',
		success: function(response){
            console.log(response);
            resetPrecisions();
		},
		error: function(error){
			console.log(error);
		}
	});
});


$('#projSyno').click(function() {
    showProjection("syno");
});
$('#projAnto').click(function() {
    showProjection("anto");
});
$('#projHyper').click(function() {
    showProjection("hyper");
});
$('#projHypo').click(function() {
    showProjection("hypo");
});
$('#projCohypo').click(function() {
    showProjection("cohypo");
});
$('#projMero').click(function() {
    showProjection("mero");
});
$('#projHolo').click(function() {
    showProjection("holo");
});
$('#projTropo').click(function() {
    showProjection("tropo");
});


$('#annoHist').click(function() {
    $.ajax({
		url: '/history',
		type: 'POST',
        dataType: "json",
		success: function(response){
            var content = JSON.stringify(response);
            content = content.replace("},", "},\n");
            document.getElementById("histEditor").value = content;
            $("#modalEditor").modal("show");
		},
		error: function(error){
			console.log(error);
		}
	});
});

$('#saveHist').click(function() {
    var data = document.getElementById("histEditor").value;
    $.ajax({
		url: '/savehistory',
		type: 'POST',
        contentType: 'application/json',
        data: data,
		success: function(response){
            console.log(response)
		},
		error: function(error){
			console.log(error);
		}
	});
});

$('#histGraph').click(function() {
    $.ajax({
		url: '/history',
		type: 'POST',
        dataType: "json",
		success: function(response){
            selected_node = null;
            selected_link = null;
            nodes.length = 0;
            links.length = 0;

            restart();

            svg.classed('active', true);

            linkContainer = [];
            var x, y, rel, node, link;

            response.forEach((e) => {
                x = e.x;
                y = e.y;
                rel = e.relation;

                if (!nodes.some(e => e.id === x)) {
                    node = {id: x, reflexive: false};
                    nodes.push(node);
                }
                if (!nodes.some(e => e.id === y)) {
                    node = {id: y, reflexive: false};
                    nodes.push(node);
                }
                if (!linkContainer.some(e => e.source === x && e.target === y) && !linkContainer.some(e => e.source === y && e.target === x)) {
                    link = {source: x, target: y, relation: rel, left: false, right: false};
                    linkContainer.push(link);
                }
            });
            linkContainer = [...new Set(linkContainer)];

            var source, target, direction;
            direction = "right";

            linkContainer.forEach((e) => {
                x = e.source;
                y = e.target;
                rel = e.relation;

                source = nodes.find(function(element) {
                    return element.id === x;
                });
                target = nodes.find(function(element) {
                    return element.id === y;
                });

                link = {source: source, target: target, relation: rel, left: false, right: false};

                if(rel === "syno" || rel === "anto" || rel === "cohypo" || rel === "cohypo"){
                    link[direction] = false;
                }
                else {
                    link[direction] = true;
                }
                links.push(link);
            });

            resetPrecisions();
            annotations.length = 0;
            updateAnnotationCounts();
            restart();
            restart();
		},
		error: function(error){
			console.log(error);
		}
	});
});

$('#clrHist').click(function() {
    $.ajax({
		url: '/clearhistory',
		type: 'POST',
		success: function(response){
            console.log(response)
		},
		error: function(error){
			console.log(error);
		}
	});
});

$('#learnHist').click(function() {
    var alpha = document.getElementById("learnRate").value;
    var iterations = document.getElementById("iterations").value;
	$.ajax({
		url: '/learnhistory',
		type: 'POST',
		data:{alpha: alpha, iterations: iterations},
		success: function(response){
            console.log(response);
            resetPrecisions();
            annotations.length = 0;
            updateAnnotationCounts();
            myAlert('History learned.')
		},
		error: function(error){
			console.log(error);
		}
	});
});

$('#termbtn').click(function() {
    addNewNodeFromInput();
});


$('.relbtn').click(function() {
    if(selected_link){
        var rel = $(this).attr('data-relation');
        annotate(rel, 'train');
    }
});

$("#learnbtn").on("click change", function(e) {
    updateAnnotationCounts();
});

$('#lrnAll').click(function() {
    trainBatch('all');
});
$('#lrnSyno').click(function() {
    trainBatch('syno');
});
$('#lrnAnto').click(function() {
    trainBatch('anto');
});
$('#lrnHyper').click(function() {
    trainBatch('hyper');
});
$('#lrnHypo').click(function() {
    trainBatch('hypo');
});
$('#lrnCohypo').click(function() {
    trainBatch('cohypo');
});
$('#lrnMero').click(function() {
    trainBatch('mero');
});
$('#lrnHolo').click(function() {
    trainBatch('holo');
});
$('#lrnTropo').click(function() {
    trainBatch('tropo');
});

$(function() {
    $('#loadbtn').click(function() {
        if($('#optionGer').is(':checked')){
            $(this).prop("disabled", true);
            $(this).html(
                `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`
            );
            $.ajax({
                url: '/model',
                type: 'POST',
                data:{model: "german"},
                // dataType: "json",
                success: function(response){
                    $('#loadbtn').prop("disabled", false);
                    $('#loadbtn').html(
                        `<span role="status" aria-hidden="true"></span> Load`
                    );
                    myAlert('German embedding loaded.');
                    console.log(response);
                },
                error: function(error){
                    console.log(error);
                }
            });
        }
        else if($('#optionEn').is(':checked')){
            $(this).prop("disabled", true);
            $(this).html(
                `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`
            );
            $.ajax({
                url: '/model',
                type: 'POST',
                data:{model: "english"},
                // dataType: "json",
                success: function(response){
                    $('#loadbtn').prop("disabled", false);
                    $('#loadbtn').html(
                        `<span role="status" aria-hidden="true"></span> Load`
                    );
                    myAlert('English embedding loaded.');
                    console.log(response);
                },
                error: function(error){
                    console.log(error);
                }
            });
        }
        else if($('#optionOwn').is(':checked')){
            if(document.getElementById("file-upload").value !== ""){
                $(this).prop("disabled", true);
                $(this).html(
                    `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`
                );
                var form_data = new FormData($('#upload-file')[0]);
                $.ajax({
                    type: 'POST',
                    url: '/upload',
                    data: form_data,
                    contentType: false,
                    cache: false,
                    processData: false,
                    success: function(response) {
                        $('#loadbtn').prop("disabled", false);
                        $('#loadbtn').html(
                            `<span role="status" aria-hidden="true"></span> Load`
                        );
                        myAlert('Custom embedding loaded.');
                        console.log(response);
                    },
                    error: function(error){
                        $('#loadbtn').prop("disabled", false);
                        $('#loadbtn').html(
                            `<span role="status" aria-hidden="true"></span> Load`
                        );
                        myAlert('Loading of custom embedding failed.');
                    console.log(error);
                    }
                });
            }
            else{
                myAlert("Please choose your embedding model.");
            }
        }
        else {
            myAlert('No Model Selected.');
        }
    });
});