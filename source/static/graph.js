// Based on https://github.com/networkx/networkx/tree/master/examples/javascript / https://bl.ocks.org/mbostock/2675ff61ea5e063ede2b5d63c08020c7
// and https://bl.ocks.org/mbostock/950642

var width = 900;
var height = 600;

var svg = d3.select("div#svg-container")
  .append("svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 900 600")
  .classed("svg-content", true);

var borderPath = svg.append("rect")
    .attr("class", "svg-border")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", height)
    .attr("width", width);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) { return d.id;})
    .distance(60).strength(1))
    .force('x', d3.forceX(width / 2).strength(0.015)) // Setting this works as gravity, i.e. prevents the nodes from leaving the graph
    .force('y', d3.forceY(height / 2).strength(0.02))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));


// Get the file containing the data for the requested graph: The filename is passed from the attribute 'data' of the <script> tag in the HTML
var graph_data_file = document.currentScript.getAttribute('data');

// The URL where the file is delivered by the webservice
var graph_data_url = "/graph-data/" + graph_data_file;

// Use the d3.json() method to load data from the JSON file containing the data for the requested graph
d3.json(graph_data_url, function (error, graph) {
    if (error) throw error;

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line");

    var node = svg.selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("node_type", function(d) { return d.tweet_type;}) // Tweet type is stored in attribute 'node_type'
        .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));

    // Set the 'line_type' for each line based on the 'tweet_type' of the target node
    svg.selectAll("line")
        .attr("line_type", function(d, i){
          for (var i = 0; i < graph.nodes.length; i++) {
            if (graph.nodes[i].id == d.target) {
              return graph.nodes[i].tweet_type;
            }
          }
        });


        // Append a "defs" element to SVG
        var defs = svg.append("defs").attr("id", "imgdefs")

        // Store an element called "clipPath#clip-circle-small" in defs, which can be used at a later time
        var clipPath = defs.append('clipPath').attr('id', 'clip-circle-small')
                .append("circle")
                .attr("r", 12)
                .attr("cx", 0)
                .attr("cy", 0);

        // "clipPath#clip-circle-large" is needed when images are enlarged on mouseover
        clipPath = defs.append('clipPath').attr('id', 'clip-circle-large')
                .append("circle")
                .attr("r", 12*1.5)
                .attr("cx", 0)
                .attr("cy", 0);

        // "clipPath#clip-circle-root" is needed for root_tweet
        clipPath = defs.append('clipPath').attr('id', 'clip-circle-root')
                .append("circle")
                .attr("r", 12*2)
                .attr("cx", 0)
                .attr("cy", 0);

        // Use images (profile pictures) to display the nodes
        node.append("image")
                .attr("node_type", function(d) { return d.tweet_type;}) // Tweet type is stored in attribute 'type'
        		    .attr("xlink:href", function (d) { return d.profile_picture; })

                // Set size of image (all small, except for the root_tweet which is larger)
              	.attr("x", function(d) {
                  if (d.tweet_type == 'root_tweet') return -24;
                  else return -12})
              	.attr("y", function(d) {
                  if (d.tweet_type == 'root_tweet') return -24;
                  else return -12})
              	.attr("width", function(d) {
                  if (d.tweet_type == 'root_tweet') return 48;
                  else return 24})
              	.attr("height", function(d) {
                  if (d.tweet_type == 'root_tweet') return 48;
                  else return 24})

                // Clip images to a circle shape using #clip-circle-small / for root_tweet use #clip-circle-root
                .attr("clip-path", function(d) {
                  if (d.tweet_type == 'root_tweet') return "url(#clip-circle-root)";
                  else return "url(#clip-circle-small)";
                });


	//Add user name to the node
 	node.append("text")
        .attr("class", "text-screenname")
        .attr("dx", function(d, i){
          if (graph.nodes[i].tweet_type == 'root_tweet') return 12*1.5+10;
          else return 12*1.5+2})
        .attr("dy", "0.35em")
        .style("visibility","hidden")
        .text(function(d) { return "@" + d.screen_name;})
        .call(getBB);

        // Add a background box to the '.text_screenname' label
        node.insert("rect", ".text-screenname")
            .attr("class", "text-screenname-background")
            .attr("x", function(d, i){
                if (graph.nodes[i].tweet_type == 'root_tweet') return d.bbox.x + 1.5;
                else return d.bbox.x;
              })
            .attr("y", "-0.35em")
            .attr("rx", "5") // Give the rect slightly rounded corners
            .attr("ry", "5")
            .attr("width", function(d){return d.bbox.width;})
            .attr("height", function(d){return d.bbox.height;})
            .style("visibility", "hidden");

    // Add user_name, screen_name and timestamp as a label to the nodes
    node.append("text")
        .attr("class", "text-user")
        .attr("dx", function(d, i){
          if (graph.nodes[i].tweet_type == 'root_tweet') return 12*1.5+10;
          else return 12*1.5+2})
        .attr("dy", "-0.95em")
        // Text is hidden
        .style("visibility","hidden")
        .text(function(d) { return d.user_name + " (@" + d.screen_name + "), " + d.timestamp;});

	// Add the tweet_content to the label
    node.append("text")
        .attr("class", "text-content")
        .attr("dx", function(d, i){
          if (graph.nodes[i].tweet_type == 'root_tweet') return 12*1.5+10;
          else return 12*1.5+2})
        .attr("dy", "0.35em")
        // Text is hidden
        .style("visibility","hidden")
        .text(function(d) { return d.tweet_content;})
		.call(wrap, 350)
    	.call(getBB);

    // Add a background box to the '.text_user' and '.text_content' label
  	node.insert("rect", ".text-user")
        .attr("class", "text-user-background")
  		  .attr("x", function(d){return d.bbox.x;})
      	.attr("y", "-1.5em")
        .attr("rx", "5") // Give the rect slightly rounded corners
        .attr("ry", "5")
  		  .attr("width", function(d){return d.bbox.width;})
      	.attr("height", function(d){return d.bbox.height + 20;})
        .style("visibility", "hidden");


//This function gets the background box for the label text
function getBB(text) {
    text.each(function(d){d.bbox = this.getBBox();})
}

	//This function wraps the text in more lines instead of one
	function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.2,
            x = text.attr("x"),
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", 0)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", 18)
                            .attr("y", y)
                            .attr("dy", lineHeight + "em")
                            .text(word);
            }
        }
    });
}

	var setEvents = node

		.on("mouseover", function(d) {
          // Mouseover enlarges image
          d3.select(this).select("image")
            	.transition()
              	.duration(200)
                .attr("x", function(d) {
                  if (d.tweet_type == 'root_tweet') return -24;
                  else return -12*1.5})
                .attr("y", function(d) {
                  if (d.tweet_type == 'root_tweet') return -24;
                  else return -12*1.5})
                .attr("width", function(d) {
                  if (d.tweet_type == 'root_tweet') return 48;
                  else return 24*1.5})
                .attr("height", function(d) {
                  if (d.tweet_type == 'root_tweet') return 48;
                  else return 24*1.5})

                // Clip images to the larger circle shape using #clip-circle-large
                .attr("clip-path", function(d) {
                  if (d.tweet_type == 'root_tweet') return "url(#clip-circle-root)";
                  else return "url(#clip-circle-large)";
                });

          // Mouseover shows the hidden texts '.text-user' and '.text-content'
          	d3.select(this).select(".text-user-background")
          	.style("visibility", "visible");
          	d3.select(this).selectAll(".text-user")
          	.style("visibility", "visible");
            d3.select(this).selectAll(".text-content")
            .style("visibility", "visible");
		 })

		.on("mouseout", function(d)	{
        // On mouseout the image becomes smaller again
        d3.select(this).select("image")
          .transition()
            .duration(200)
            .attr("x", function(d) {
              if (d.tweet_type == 'root_tweet') return -24;
              else return -12})
            .attr("y", function(d) {
              if (d.tweet_type == 'root_tweet') return -24;
              else return -12})
            .attr("width", function(d) {
              if (d.tweet_type == 'root_tweet') return 48;
              else return 24})
            .attr("height", function(d) {
              if (d.tweet_type == 'root_tweet') return 48;
              else return 24})
            .attr("clip-path", function(d) {
              if (d.tweet_type == 'root_tweet') return "url(#clip-circle-root)";
              else return "url(#clip-circle-small)";
            });
        // On mouseout the texts '.text-user' and '.text-content' are hidden again
          d3.select(this).select(".text-user-background")
          .style("visibility", "hidden");
          d3.select(this).selectAll(".text-user")
          .style("visibility", "hidden");
          d3.select(this).selectAll(".text-content")
          .style("visibility", "hidden");
 		})

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation
   		.force("link")
      .links(graph.links);


    function ticked() {

          node
              .attr("transform", function(d) {
                  return "translate(" + d.x + "," + d.y + ")";
              });

        link
            .attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });
    }
});


function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function toggle_labels(toggle_button){
  if(toggle_button.value == "Display user names") {
    toggle_button.value = "Don't display user names";
    d3.selectAll(".node").selectAll(".text-screenname")
      .style("visibility", "visible");

    d3.selectAll(".node").selectAll(".text-screenname-background")
      .style("visibility", "visible");
  }
  else if (toggle_button.value == "Don't display user names"){
    toggle_button.value = "Display user names";
    d3.selectAll(".node").selectAll(".text-screenname")
      .style("visibility", "hidden");

    d3.selectAll(".node").selectAll(".text-screenname-background")
      .style("visibility", "hidden");
  }
}
