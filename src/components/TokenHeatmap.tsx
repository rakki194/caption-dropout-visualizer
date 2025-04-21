import { createEffect, onCleanup, onMount } from 'solid-js';
import Chart from 'chart.js/auto';
import styles from './DropoutVisualizer.module.css';

interface TokenHeatmapProps {
  caption: string;
  results: string[];
  separator: string;
  theme: 'light' | 'dark';
}

interface DataPoint {
  x: number;
  y: number;
  v: number;
}

export default function TokenHeatmap(props: TokenHeatmapProps) {
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
        createHeatmap();
      });
    }
  }

  const getTokenOccurrenceMatrix = () => {
    // Extract all unique tokens from the original caption
    const tokens = props.caption
      .split(props.separator)
      .map(t => t.trim())
      .filter(Boolean);
    
    // Create a matrix to track which tokens appear in each result
    const occurrenceMatrix: boolean[][] = [];
    
    // Populate the matrix
    props.results.forEach((result, resultIndex) => {
      const resultTokens = new Set(
        result.split(props.separator)
          .map(t => t.trim())
          .filter(Boolean)
      );
      
      occurrenceMatrix[resultIndex] = tokens.map(token => resultTokens.has(token));
    });
    
    return { tokens, occurrenceMatrix };
  };
  
  const createHeatmap = () => {
    if (!chartRef) return;
    const width = chartRef.clientWidth;
    const height = chartRef.clientHeight;
    if (width === 0 || height === 0) {
      requestAnimationFrame(createHeatmap);
      return;
    }
    // Clean up previous chart
    if (chart) {
      chart.destroy();
    }
    
    const { tokens, occurrenceMatrix } = getTokenOccurrenceMatrix();
    
    // Limit to first 20 results and up to 30 tokens for visibility
    const maxResults = Math.min(20, occurrenceMatrix.length);
    const maxTokens = Math.min(30, tokens.length);
    
    const limitedTokens = tokens.slice(0, maxTokens);
    const limitedMatrix = occurrenceMatrix.slice(0, maxResults);
    
    // Calculate retention percentage for each token
    const tokenRetentionRate = limitedTokens.map((token, tokenIndex) => {
      const retentionCount = limitedMatrix.reduce((count, row) => 
        count + (row[tokenIndex] ? 1 : 0), 0);
      return (retentionCount / limitedMatrix.length) * 100;
    });
    
    // Create data for heatmap
    const data: DataPoint[] = [];
    for (let i = 0; i < maxResults; i++) {
      for (let j = 0; j < maxTokens; j++) {
        data.push({
          x: j,
          y: i,
          v: limitedMatrix[i][j] ? 1 : 0
        });
      }
    }
    
    // Theme colors
    const isDark = props.theme === 'dark';
    const textColor = isDark ? '#e0e0e0' : '#333333';
    
    // Create chart
    chart = new Chart(chartRef, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Token Presence',
          data: data,
          backgroundColor: (context) => {
            // Safely access raw data
            const value = context.raw ? (context.raw as DataPoint).v : 0;
            return value ? '#4a7dff' : '#f0f0f0';
          },
          borderColor: isDark ? '#1f1f1f' : '#e0e0e0',
          borderWidth: 1,
          pointRadius: 10,
          pointHoverRadius: 12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'category',
            position: 'top',
            labels: limitedTokens,
            ticks: {
              color: textColor,
              autoSkip: false,
              maxRotation: 90,
              minRotation: 90
            },
            grid: {
              display: false
            }
          },
          y: {
            type: 'category',
            labels: Array.from({ length: maxResults }, (_, i) => `Result ${i + 1}`),
            ticks: {
              color: textColor
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Token Presence Heatmap',
            color: textColor,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const dataIndex = context.dataIndex;
                const tokenIndex = Math.floor(dataIndex % maxTokens);
                const resultIndex = Math.floor(dataIndex / maxTokens);
                const token = limitedTokens[tokenIndex];
                // Safely access the data point
                const dataPoint = data[dataIndex] as DataPoint;
                const present = dataPoint.v === 1;
                
                return present 
                  ? `${token} is present in Result ${resultIndex + 1}`
                  : `${token} is absent in Result ${resultIndex + 1}`;
              }
            }
          }
          // Removed annotation plugin which isn't registered
        }
      }
    });
    
    // Add token retention info
    const ctx = chartRef.getContext('2d');
    if (ctx && chart.scales && chart.scales.x && chart.chartArea) {
      ctx.save();
      ctx.font = '10px Arial';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      
      // Add title for retention percentages
      ctx.fillText('Token Retention %', chart.chartArea.left + 60, chart.chartArea.bottom + 20);
      
      for (let i = 0; i < maxTokens; i++) {
        const x = chart.scales.x.getPixelForValue(i);
        const y = chart.chartArea.bottom + 40;
        ctx.fillText(`${tokenRetentionRate[i].toFixed(0)}%`, x, y);
      }
      
      ctx.restore();
    }
  };
  
  createEffect(() => {
    const { results, theme } = props;
    if (results.length > 0 && chartRef && chartRef.isConnected) {
      if (chart) chart.destroy();
      doubleRAF(() => {
        createHeatmap();
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
    <div class={styles.chartContainer} style={{ width: '100%', 'min-width': '400px', height: '450px' }}>
      <h3>Token Presence Across Results</h3>
      <p>This heatmap shows which tokens are present (blue) or absent (light) in each result.</p>
      <div style={{ height: '400px' }}>
        <canvas ref={handleChartRef} width="600" height="400"></canvas>
      </div>
    </div>
  );
} 