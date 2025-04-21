import { createEffect, onCleanup, onMount } from 'solid-js';
import * as d3 from 'd3';
// @ts-ignore - Workaround for d3-cloud module type issues
import cloud from 'd3-cloud';
import styles from './DropoutVisualizer.module.css';

interface WordCloudProps {
  caption: string;
  results: string[];
  separator: string;
  theme: 'light' | 'dark';
}

interface WordData {
  text: string;
  value: number;
  isOriginal: boolean;
  size?: number;
  x?: number;
  y?: number;
  rotate?: number;
}

export default function WordCloud(props: WordCloudProps) {
  let svgRef: SVGSVGElement | undefined;

  const getTokenFrequencies = (): WordData[] => {
    // Get tokens from the original caption
    const originalTokens = props.caption
      .split(props.separator)
      .map(t => t.trim())
      .filter(Boolean);
    
    const originalTokenSet = new Set(originalTokens);
    
    // Count token frequencies across all results
    const frequencies: Record<string, number> = {};
    
    props.results.forEach(result => {
      const resultTokens = result
        .split(props.separator)
        .map(t => t.trim())
        .filter(Boolean);
      
      resultTokens.forEach(token => {
        frequencies[token] = (frequencies[token] || 0) + 1;
      });
    });
    
    // Convert to array of word data
    const wordData = Object.entries(frequencies)
      .map(([text, value]) => ({
        text,
        value: Math.max(10, value), // Minimum size for visibility
        isOriginal: originalTokenSet.has(text)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 100); // Limit to top 100 words
    
    return wordData;
  };
  
  const createWordCloud = () => {
    if (!svgRef) return;
    
    // Clear existing content
    d3.select(svgRef).selectAll("*").remove();
    
    const words = getTokenFrequencies();
    if (words.length === 0) return;
    
    // Get dimensions
    const width = svgRef.clientWidth;
    const height = svgRef.clientHeight;
    
    // Theme colors
    const isDark = props.theme === 'dark';
    const textColor = (d: WordData) => {
      if (d.isOriginal) {
        return isDark ? '#73b2ff' : '#0066cc';
      } else {
        return isDark ? '#ff8086' : '#cc0033';
      }
    };
    
    // Create layout
    // @ts-ignore - Ignore type checking for d3-cloud usage
    const layout = cloud()
      .size([width, height])
      .words(words.map(d => ({ text: d.text, size: 0, value: d.value, isOriginal: d.isOriginal })))
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      // @ts-ignore - Ignore type checking for fontSize callback
      .fontSize(d => Math.min(50, 10 + Math.sqrt(d.value)))
      // @ts-ignore - Ignore type checking for on callback
      .on('end', (words) => {
        // Render the layout
        d3.select(svgRef)
          .append('g')
          .attr('transform', `translate(${width / 2},${height / 2})`)
          .selectAll('text')
          .data(words)
          .enter()
          .append('text')
          // @ts-ignore - Ignore type checking for style callback
          .style('font-size', d => `${d.size}px`)
          .style('font-family', 'Impact')
          // @ts-ignore - Ignore type checking for style callback
          .style('fill', d => textColor(d as WordData))
          .attr('text-anchor', 'middle')
          // @ts-ignore - Ignore type checking for attr callback
          .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
          // @ts-ignore - Ignore type checking for text callback
          .text(d => d.text)
          .append('title')
          // @ts-ignore - Ignore type checking for text callback
          .text(d => {
            const wordData = d as WordData;
            const percentage = (wordData.value / props.results.length * 100).toFixed(1);
            return `${wordData.text}: ${percentage}% occurrence rate${wordData.isOriginal ? " (in original caption)" : ""}`;
          });
      });
    
    layout.start();
  };
  
  onMount(() => {
    if (props.results.length > 0) {
      createWordCloud();
    }
    
    // Handle window resize for responsiveness
    const handleResize = () => {
      createWordCloud();
    };
    
    window.addEventListener('resize', handleResize);
    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
    });
  });
  
  // Update chart when results or theme changes
  createEffect(() => {
    const { results, theme } = props;
    if (results.length > 0) {
      createWordCloud();
    }
  });
  
  return (
    <div class={styles.chartContainer}>
      <h3>Word Cloud Visualization</h3>
      <p>
        Tokens in <span style={{ color: props.theme === 'dark' ? '#73b2ff' : '#0066cc' }}>blue</span> are 
        from the original caption, while <span style={{ color: props.theme === 'dark' ? '#ff8086' : '#cc0033' }}>red</span> tokens
        are new (from shuffling operations). Size represents frequency.
      </p>
      <div class={styles.wordCloud}>
        <svg ref={svgRef} width="100%" height="100%"></svg>
      </div>
    </div>
  );
} 