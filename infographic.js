const width = 800;
const height = 800;
const radius = 180;
const labelOffset = 260;

const data = [
  { label: "Clock", icon: "⏰", color: "#f39c12", triangleColor: "#2ecc71"  },
  { label: "Chat", icon: "💬", color: "#2ecc71", triangleColor: "#3498db"},
  { label: "Settings", icon: "⚙️", color: "#3498db", triangleColor: "#e74c3c" },
  { label: "User", icon: "👤", color: "#e74c3c", triangleColor: "#f39c12" },
];

const svg = d3.select("svg")
  .attr("viewBox", [0, 0, width, height]);

const g = svg.append("g")
  .attr("transform", `translate(${width / 2}, ${height / 2})`);

// Create pie layout starting at 12 o'clock
const pie = d3.pie()
  .value(1)
  .sort(null)
  .startAngle(-Math.PI / 2)
  .endAngle(Math.PI * 3 / 2);

// Generate arcs and attach color directly
const arcs = pie(data).map((d, i) => {
  d.color = data[i].color;
  d.triangleColor = data[i].triangleColor;
  d.label = data[i].label;
  d.icon = data[i].icon;
  return d;
});

const arc = d3.arc().innerRadius(120).outerRadius(radius);

// Draw donut segments
g.selectAll("path.arc")
  .data(arcs)
  .enter()
  .append("path")
  .attr("class", "arc")
  .attr("d", arc)
  .attr("fill", d => d.color);

// Add triangle tabs pointing outward
g.selectAll("path.triangle")
  .data(arcs)
  .enter()
  .append("path")
  .attr("class", "triangle")
  .attr("d", d => {
    const outerRadius = radius;
    const tipLength = 30;
    const angle = (d.startAngle + d.endAngle) /2;

    const tipX = Math.cos(angle) * (outerRadius + tipLength);
    const tipY = Math.sin(angle) * (outerRadius + tipLength);

    const baseOffsetAngle = 0.12;
    const base1X = Math.cos(angle - baseOffsetAngle) * outerRadius;
    const base1Y = Math.sin(angle - baseOffsetAngle) * outerRadius;
    const base2X = Math.cos(angle + baseOffsetAngle) * outerRadius;
    const base2Y = Math.sin(angle + baseOffsetAngle) * outerRadius;

    const path = d3.path();
    path.moveTo(base1X, base1Y);
    path.lineTo(base2X, base2Y);
    path.lineTo(tipX, tipY);
    path.closePath();
    return path.toString();
  })
  .attr("fill", d => d.triangleColor)
  .attr("stroke", "white")
  .attr("stroke-width", 0);

// Add center label
g.append("text")
  .attr("text-anchor", "middle")
  .attr("dy", "0.35em")
  .style("font-size", "20px")
  .style("font-weight", "bold")
  .text("BIORESILIENCE SCORE");

// Add icons and labels around the circle
g.selectAll("g.label")
  .data(arcs)
  .enter()
  .append("g")
  .attr("class", "label")
  .attr("transform", d => {
    const [x, y] = d3.arc().innerRadius(labelOffset).outerRadius(labelOffset).centroid(d);
    return `translate(${x},${y})`;
  })
  .each(function (d) {
    const group = d3.select(this);
    group.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .style("font-size", "22px")
      .text(d.icon);

    group.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(d.label);
  });
