/// <reference path="../../typings/d3/d3.d.ts"/>

var width = 960,
  height = 500;

var color = d3.scale.category20();

var force = d3.layout.force()
  .charge(-120)
  .linkDistance(30)
  .size([width, height]);

var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

d3.json("mentions.json", (error, graph: GraphData) => {
  force
    .nodes(graph.nodes)
    .links(graph.links)
    .start();

  var link = svg.selectAll(".link")
    .data(graph.links)
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", (d) => Math.sqrt(d.value));

  var node = svg.selectAll(".node")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", 5)
    .style("fill", (d) => color(d.group.toString()))
    .call(force.drag);

  node.append("title")
    .text((d) => d.name);

  force.on("tick", () => {
    link.attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y);

    node.attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y);
  });
});
