import { createEffect, onCleanup, onMount } from 'solid-js';
import Chart from 'chart.js/auto';
import styles from './DropoutVisualizer.module.css';

interface PositionAnalysisChartProps {
  caption: string;
  results: string[];
  separator: string;
  theme: 'light' | 'dark';
}

export default function PositionAnalysisChart(props: PositionAnalysisChartProps) {
  let chartRef: HTMLCanvasElement | undefined;
  let chart: Chart | undefined;

  const analyzePositionEffects = () => {
    // Get tokens from original caption
    const originalTokens = props.caption
      .split(props.separator)
      .map(t => t.trim())
      .filter(Boolean);
    
    if (originalTokens.length === 0) return null;
    
    // Position buckets (divide tokens into 10 segments by position)
    const numBuckets = Math.min(10, originalTokens.length);
    const bucketSize = originalTokens.length / numBuckets;
    
    // Initialize counters for each position bucket
    const positionCounts = new Array(numBuckets).fill(0);
    const positionRetentions = new Array(numBuckets).fill(0);
    
    // Analyze each result
    props.results.forEach(result => {
      const resultTokens = result
        .split(props.separator)
        .map(t => t.trim())
        .filter(Boolean);
      
      // Check which tokens from original caption are retained
      originalTokens.forEach((token, index) => {
        // Determine which bucket this token belongs to
        const bucketIndex = Math.min(Math.floor(index / bucketSize), numBuckets - 1);
        
        // Increment total counts for this position
        positionCounts[bucketIndex]++;
        
        // If token is in result, increment retention count
        if (resultTokens.includes(token)) {
          positionRetentions[bucketIndex]++;
        }
      });
    });
    
    // Calculate retention rates for each position bucket
    const retentionRates = positionCounts.map((count, index) => 
      count > 0 ? (positionRetentions[index] / count) * 100 : 0
    );
    
    // Create bucket labels
    const bucketLabels = Array.from({ length: numBuckets }, (_, i) => {
      const start = Math.round(i * bucketSize) + 1;
      const end = Math.round((i + 1) * bucketSize);
      return start === end ? `Position ${start}` : `Positions ${start}-${end}`;
    });
    
    return { bucketLabels, retentionRates };
  };
  
  const createChart = () => {
    if (!chartRef) return;
    
    // Clean up previous chart
    if (chart) {
      chart.destroy();
    }
    
    const analysis = analyzePositionEffects();
    if (!analysis) return;
    
    const { bucketLabels, retentionRates } = analysis;
    
    // Theme colors
    const isDark = props.theme === 'dark';
    const textColor = isDark ? '#e0e0e0' : '#333333';
    const barColor = isDark ? '#3d6fd9' : '#4a7dff';
    
    // Create chart
    chart = new Chart(chartRef, {
      type: 'bar',
      data: {
        labels: bucketLabels,
        datasets: [{
          label: 'Token Retention by Position (%)',
          data: retentionRates,
          backgroundColor: barColor,
          borderColor: isDark ? '#2d5aaf' : '#3a63cc',
          borderWidth: 1
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
              color: textColor
            },
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            title: {
              display: true,
              text: 'Token Position in Caption',
              color: textColor
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Token Retention by Position',
            color: textColor,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.formattedValue}% retention rate`;
              }
            }
          }
        }
      }
    });
  };
  
  onMount(() => {
    createChart();
  });
  
  // Update chart when results or theme changes
  createEffect(() => {
    const { results, theme } = props;
    if (results.length > 0) {
      createChart();
    }
  });
  
  onCleanup(() => {
    if (chart) {
      chart.destroy();
    }
  });
  
  return (
    <div class={styles.chartContainer}>
      <h3>Token Retention by Position</h3>
      <p>This chart shows how token position affects retention probability.</p>
      <div style={{ height: '350px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
} 