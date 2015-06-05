interface ForceGraphNode {
  name: string;
  group: number;
}

interface ForceGraphLink {
  source: number;
  target: number;
  value: number;
}

interface ForceGraphData {
  nodes: Array<ForceGraphNode>;
  links: Array<ForceGraphLink>;
}
