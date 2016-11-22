import data from './bigData.js';
import React from 'react';
import ReactDOM from 'react-dom';
import * as d3 from 'd3';

const root = d3.hierarchy(data);

function flatten(root) {
  let nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }
  recurse(root);
  return nodes;
}

const Node = (props) => (
  <circle
    data-index={props.i}
    r={Math.sqrt(props.size) / 10 || 4.5}
    cx={props.x}
    cy={props.y}
    style={{
      "fill": props.color,
      "cursor": "pointer",
      "stroke": "#3182bd",
      "strokeWidth": "1.5px"
    }}
    onClick={props.onClick}
    onMouseDown={props.onDragStart}
  />
);

const Link = ({datum}) => (
  <line
    x1={datum.source.x}
    y1={datum.source.y}
    x2={datum.target.x}
    y2={datum.target.y}
    style={{
      "stroke":"#9ecae1", 
      "fill": "none",
      "strokeWidth": "1.5px"
    }}
  />
);

const Graph = React.createClass({

  getInitialState () {
    const svgWidth = 700;
    const svgHeight = 700;
    let simulation = d3.forceSimulation()
          .force("fx", d3.forceX(svgWidth / 2))
          .force("fy", d3.forceY(svgHeight / 2))
          .force("link", d3.forceLink())
          .force("charge", d3.forceManyBody())
          .force("collide", d3.forceCollide());

      return {
        svgWidth: svgWidth,
        svgHeight: svgHeight,
        simulation: simulation,
        root: this.props.root,
        nodes: null,
        links: null,
        dragIndex: -1,
        dragStartNodeX: 0,
        dragStartNodeY: 0,
        dragStartMouseX: 0,
        dragStartMouseY: 0
      };
    },
  componentWillMount () {
    this.state.nodes = flatten(this.state.root);
    this.state.links = this.state.root.links();
    this.state.simulation
      .nodes(this.state.nodes)
      .force("link").links(this.state.links);
    this.state.simulation
      .on("tick", () => this.forceUpdate());
  },
  update(x) {
    this.state.nodes = flatten(this.state.root);
    this.state.links = this.state.root.links();
    this.state.simulation
      .nodes(this.state.nodes)
      .force("link").links(this.state.links);
    this.state.simulation
      .alpha(x)
      .restart();
  },
  
  drawLinks () {
    const links = this.state.links.map(function (link, index) {
      return (<Link datum={link} key={index} />);
    });
    return (<g> {links} </g>);
  },
  drawNodes () {
    const onClick = this.onClick;
    const onDragStart = this.onDragStart;
    const nodes = this.state.nodes.map(function (node, index) {
      return (
        <Node 
          key={index}
          x={node.x}
          y={node.y}
          i={index}
          size={node.size || node.data.size}
          color={node._children ? "#3182bd" : node.children ? "#c6dbef" : "#fd8d3c"}
          onClick={onClick}
          onDragStart={onDragStart}
        />
      );
    });
    return (<g> {nodes} </g>);
  },
  
  onClick (e) {
    const nodes = this.state.nodes;
    const index = parseInt(e.target.attributes["data-index"].value);
    const node = nodes[index];
    if (node.children || node._children) {
      if (node.children) {
        node._children = node.children;
        node.children = null;
      } else {
        node.children = node._children;
        node._children = null;
      }
    }
    this.update(0.3);
  },
  onDragStart (e) {
    const nodes = this.state.nodes;
    const index = parseInt(e.target.attributes["data-index"].value);
    const node = nodes[index];
    this.setState({dragIndex: index, dragStartX: node.x, dragStartY: node.y,
                   dragStartMouseX: e.clientX, dragStartMouseY: e.clientY });
  },
  onDrag (e) {
    if (this.state.dragIndex < 0) { return; }
    const node = this.state.nodes[this.state.dragIndex];
    node.fx = this.state.dragStartX + e.clientX - this.state.dragStartMouseX;
    node.fy = this.state.dragStartY + e.clientY - this.state.dragStartMouseY;
    this.setState({});
    this.update(0.3);
  },
  onDragEnd (e) {
    if (this.state.dragIndex < 0) { return; }
    const node = this.state.nodes[this.state.dragIndex];
    node.fx = null;
    node.fy = null;
    this.setState({dragIndex: -1});
    this.update(0);
  },
  
  render () {
    return (
      <div>
        <svg
          onMouseMove={this.onDrag}
          onMouseUp={this.onDragEnd}
          onMouseLeave={this.onDragEnd}
          style={{"border": "2px solid black",
                  "margin": "20px"}}
          width={this.state.svgWidth}
          height={this.state.svgHeight}
        >
          {this.drawLinks()}
          {this.drawNodes()}
        </svg>
      </div>
    );
  }
});

const mount = document.createElement('div');
mount.id = 'app';
document.body.appendChild(mount);

ReactDOM.render(<Graph root={root}/>, document.getElementById("app"));   
