import { createEffect, onCleanup } from 'solid-js';
import Chart from 'chart.js/auto';
import styles from './DropoutVisualizer.module.css';

interface TokenFrequencyChartProps {
  caption: string;
  results: string[];
  separator: string;
  theme: 'light' | 'dark';
}

export default function TokenFrequencyChart(props: TokenFrequencyChartProps) {
  let chartRef: HTMLCanvasElement | undefined;
  let chart: Chart | undefined;

  function doubleRAF(fn: () => void) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  function handleChartRef(el: HTMLCanvasElement) {
    chartRef = el;
    if (chart) {
      chart.destroy();
      chart = undefined;
    }
    if (chartRef && chartRef.isConnected) {
      doubleRAF(() => {
        createChart();
      });
    }
  }

  const getTokenFrequencies = () => {
    // Extract all tokens from the original caption
    const tokens = props.caption
      .split(props.separator)
      .map(t => t.trim())
      .filter(Boolean);
    
    // Count occurrences in results
    const frequencies: Record<string, number> = {};
    tokens.forEach(token => {
      frequencies[token] = 0;
    });
    
    // Count occurrences
    props.results.forEach(result => {
      const resultTokens = result
        .split(props.separator)
        .map(t => t.trim())
        .filter(Boolean);
      
      resultTokens.forEach(token => {
        if (token in frequencies) {
          frequencies[token]++;
        }
      });
    });
    
    // Convert to percentage
    const totalResults = props.results.length;
    const percentages: Record<string, number> = {};
    
    Object.keys(frequencies).forEach(token => {
      percentages[token] = (frequencies[token] / totalResults) * 100;
    });
    
    return percentages;
  };
  
  const createChart = () => {
    if (!chartRef) return;
    const width = chartRef.clientWidth;
    const height = chartRef.clientHeight;
    if (width === 0 || height === 0) {
      requestAnimationFrame(createChart);
      return;
    }
    // Clean up previous chart
    if (chart) {
      chart.destroy();
    }
    
    const frequencies = getTokenFrequencies();
    const tokens = Object.keys(frequencies);
    const data = Object.values(frequencies);
    
    // Sort by frequency (descending)
    const sortedIndices = data.map((_, i) => i).sort((a, b) => data[b] - data[a]);
    const sortedTokens = sortedIndices.map(i => tokens[i]);
    const sortedData = sortedIndices.map(i => data[i]);
    
    // Limit to top 30 tokens for readability
    const displayTokens = sortedTokens.slice(0, 30);
    const displayData = sortedData.slice(0, 30);
    
    // Theme colors
    const isDark = props.theme === 'dark';
    const textColor = isDark ? '#e0e0e0' : '#333333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Create chart
    chart = new Chart(chartRef, {
      type: 'bar',
      data: {
        labels: displayTokens,
        datasets: [{
          label: 'Token Retention %',
          data: displayData,
          backgroundColor: isDark ? '#3d6fd9' : '#4a7dff',
          borderColor: isDark ? '#2d5aaf' : '#3a63cc',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: textColor
            },
            grid: {
              color: gridColor
            },
            title: {
              display: true,
              text: 'Retention Rate (%)',
              color: textColor
            }
          },
          y: {
            ticks: {
              color: textColor
            },
            grid: {
              color: gridColor
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Token Retention by Frequency',
            color: textColor,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.formattedValue}% retained`;
              }
            }
          }
        }
      }
    });
  };
  
  const updateChart = () => {
    // Clean up previous chart
    if (chart) {
      chart.destroy();
    }
    
    // Create new chart
    createChart();
  };
  
  // Remove onMount
  // Remove requestAnimationFrame from createEffect, just call updateChart
  createEffect(() => {
    const { results, theme } = props;
    if (results.length > 0 && chartRef && chartRef.isConnected) {
      if (chart) chart.destroy();
      doubleRAF(() => {
        updateChart();
      });
    }
  });
  
  onCleanup(() => {
    if (chart) {
      chart.destroy();
      chart = undefined;
    }
  });
  
  return (
    <div class={styles.chartContainer} style={{ width: '100%', 'min-width': '400px', height: '400px' }}>
      <canvas ref={handleChartRef} width="600" height="400"></canvas>
    </div>
  );
} 