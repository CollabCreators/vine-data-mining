interface Node {
  name: string;
  group: number;
}

interface Link {
  source: number;
  target: number;
  value: number;
}

interface GraphData {
  nodes: Array<Node>;
  links: Array<Link>;
}
