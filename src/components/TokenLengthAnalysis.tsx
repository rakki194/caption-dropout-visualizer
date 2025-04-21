import { createEffect, onCleanup, onMount } from 'solid-js';
import Chart from 'chart.js/auto';
import styles from './DropoutVisualizer.module.css';

interface TokenLengthAnalysisProps {
  caption: string;
  results: string[];
  separator: string;
  theme: 'light' | 'dark';
}

interface LengthData {
  length: number;
  totalCount: number;
  retainedCount: number;
  retentionRate: number;
}

export default function TokenLengthAnalysis(props: TokenLengthAnalysisProps) {
  let chartRef: HTMLCanvasElement | undefined;
  let chart: Chart | undefined;
  let scatterRef: HTMLCanvasElement | undefined;
  let scatterChart: Chart | undefined;

  function doubleRAF(fn: () => void) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  function handleChartRef(el: HTMLCanvasElement) {
    chartRef = el;
    if (chart) {
      chart.destroy();
      chart = undefined;
    }
    if (chartRef && scatterRef && chartRef.isConnected && scatterRef.isConnected) {
      doubleRAF(() => {
        createCharts();
      });
    }
  }
  function handleScatterRef(el: HTMLCanvasElement) {
    scatterRef = el;
    if (scatterChart) {
      scatterChart.destroy();
      scatterChart = undefined;
    }
    if (chartRef && scatterRef && chartRef.isConnected && scatterRef.isConnected) {
      doubleRAF(() => {
        createCharts();
      });
    }
  }

  const analyzeTokenLengthEffects = () => {
    // Get tokens from original caption
    const originalTokens = props.caption
      .split(props.separator)
      .map(t => t.trim())
      .filter(Boolean);
    
    if (originalTokens.length === 0) return null;
    
    // Group tokens by length
    const lengthData = new Map<number, LengthData>();
    
    // Process each token in the original caption
    originalTokens.forEach(token => {
      const length = token.length;
      
      if (!lengthData.has(length)) {
        lengthData.set(length, {
          length,
          totalCount: 0,
          retainedCount: 0,
          retentionRate: 0
        });
      }
      
      lengthData.get(length)!.totalCount++;
    });
    
    // Analyze each result to check token retention
    props.results.forEach(result => {
      const resultTokens = new Set(
        result.split(props.separator)
          .map(t => t.trim())
          .filter(Boolean)
      );
      
      // Check which tokens from original caption are retained
      originalTokens.forEach(token => {
        if (resultTokens.has(token)) {
          const length = token.length;
          lengthData.get(length)!.retainedCount++;
        }
      });
    });
    
    // Calculate retention rates
    const lengthDataArray = Array.from(lengthData.values());
    lengthDataArray.forEach(data => {
      data.retentionRate = (data.retainedCount / (data.totalCount * props.results.length)) * 100;
    });
    
    return lengthDataArray.sort((a, b) => a.length - b.length);
  };
  
  const createCharts = () => {
    if (!chartRef || !scatterRef) return;
    const width1 = chartRef.clientWidth;
    const height1 = chartRef.clientHeight;
    const width2 = scatterRef.clientWidth;
    const height2 = scatterRef.clientHeight;
    if (width1 === 0 || height1 === 0 || width2 === 0 || height2 === 0) {
      requestAnimationFrame(createCharts);
      return;
    }
    // Clean up previous charts
    if (chart) chart.destroy();
    if (scatterChart) scatterChart.destroy();
    
    const lengthData = analyzeTokenLengthEffects();
    if (!lengthData || lengthData.length === 0) return;
    
    // Theme colors
    const isDark = props.theme === 'dark';
    const textColor = isDark ? '#e0e0e0' : '#333333';
    const barColor = isDark ? '#3d6fd9' : '#4a7dff';
    const pointColor = isDark ? '#e95420' : '#ff6b35';
    
    // Prepare data for grouped bar chart
    const lengths = lengthData.map(d => d.length);
    const counts = lengthData.map(d => d.totalCount);
    const retentionRates = lengthData.map(d => d.retentionRate);
    
    // Create bar chart showing counts by length
    chart = new Chart(chartRef, {
      type: 'bar',
      data: {
        labels: lengths.map(l => `${l} chars`),
        datasets: [{
          label: 'Token Count',
          data: counts,
          backgroundColor: barColor,
          borderColor: isDark ? '#2d5aaf' : '#3a63cc',
          borderWidth: 1,
          yAxisID: 'y'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor
            },
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            title: {
              display: true,
              text: 'Token Count',
              color: textColor
            }
          },
          x: {
            ticks: {
              color: textColor
            },
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            title: {
              display: true,
              text: 'Token Length',
              color: textColor
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Token Distribution by Length',
            color: textColor,
            font: {
              size: 16
            }
          }
        }
      }
    });
    
    // Create scatter plot showing retention rate by length
    scatterChart = new Chart(scatterRef, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Token Retention by Length',
          data: lengthData.map(d => ({
            x: d.length,
            y: d.retentionRate
          })),
          backgroundColor: pointColor,
          borderColor: isDark ? '#d4450e' : '#e64a19',
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: textColor
            },
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            title: {
              display: true,
              text: 'Retention Rate (%)',
              color: textColor
            }
          },
          x: {
            ticks: {
              color: textColor,
              precision: 0  // Show integers only
            },
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            title: {
              display: true,
              text: 'Token Length (characters)',
              color: textColor
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Token Retention by Length',
            color: textColor,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                const tokenLength = lengthData[index].length;
                const count = lengthData[index].totalCount;
                const rate = lengthData[index].retentionRate.toFixed(1);
                return [
                  `Length: ${tokenLength} characters`,
                  `Count: ${count} tokens`,
                  `Retention: ${rate}%`
                ];
              }
            }
          }
        }
      }
    });
  };
  
  createEffect(() => {
    const { results, theme } = props;
    if (results.length > 0 && chartRef && scatterRef && chartRef.isConnected && scatterRef.isConnected) {
      if (chart) chart.destroy();
      if (scatterChart) scatterChart.destroy();
      doubleRAF(() => {
        createCharts();
      });
    }
  });
  
  onCleanup(() => {
    if (chart) { chart.destroy(); chart = undefined; }
    if (scatterChart) { scatterChart.destroy(); scatterChart = undefined; }
  });
  
  return (
    <div class={styles.chartContainer} style={{ width: '100%', 'min-width': '400px', height: '650px' }}>
      <h3>Token Length Analysis</h3>
      <p>These charts show how token length affects retention probability.</p>
      
      <div style={{ height: '300px', 'margin-bottom': '20px' }}>
        <canvas ref={handleChartRef} width="600" height="300"></canvas>
      </div>
      
      <div style={{ height: '300px' }}>
        <canvas ref={handleScatterRef} width="600" height="300"></canvas>
      </div>
    </div>
  );
} 