// Plotly with the cartesian-only bundle (scatter, bar, histogram, heatmap),
// much smaller than the full plotly.js build.
import Plotly from 'plotly.js-cartesian-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);
export default Plot;
