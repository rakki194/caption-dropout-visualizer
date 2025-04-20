import { createEffect } from 'solid-js';
import styles from './DropoutVisualizer.module.css';

interface SimilarityMatrixProps {
  results: string[];
  separator: string;
  theme: 'light' | 'dark';
  maxResults?: number;
}

export default function SimilarityMatrix(props: SimilarityMatrixProps) {
  // Calculate Jaccard similarity between two sets of tokens
  const calculateJaccardSimilarity = (tokens1: string[], tokens2: string[]): number => {
    if (tokens1.length === 0 && tokens2.length === 0) return 1;
    
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    // Calculate intersection size
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    // Calculate union size
    const union = new Set([...set1, ...set2]);
    
    // Jaccard index = size of intersection / size of union
    return intersection.size / union.size;
  };
  
  // Get tokenized results
  const getTokenizedResults = () => {
    return props.results.map(result => 
      result.split(props.separator).map(t => t.trim()).filter(Boolean)
    );
  };
  
  // Calculate similarity matrix
  const calculateSimilarityMatrix = () => {
    const tokenizedResults = getTokenizedResults();
    const matrixSize = Math.min(tokenizedResults.length, props.maxResults || 10);
    const limitedResults = tokenizedResults.slice(0, matrixSize);
    
    const matrix: number[][] = [];
    
    for (let i = 0; i < matrixSize; i++) {
      matrix[i] = [];
      for (let j = 0; j < matrixSize; j++) {
        matrix[i][j] = calculateJaccardSimilarity(limitedResults[i], limitedResults[j]);
      }
    }
    
    return matrix;
  };
  
  // Get color for similarity value
  const getSimilarityColor = (value: number) => {
    const isDark = props.theme === 'dark';
    
    // Color scale from red (low similarity) to green (high similarity)
    if (isDark) {
      if (value >= 0.8) return 'rgba(0, 255, 0, 0.5)';
      if (value >= 0.6) return 'rgba(0, 200, 0, 0.4)';
      if (value >= 0.4) return 'rgba(255, 255, 0, 0.3)';
      if (value >= 0.2) return 'rgba(255, 100, 0, 0.3)';
      return 'rgba(255, 0, 0, 0.3)';
    } else {
      if (value >= 0.8) return 'rgba(0, 180, 0, 0.3)';
      if (value >= 0.6) return 'rgba(100, 200, 0, 0.25)';
      if (value >= 0.4) return 'rgba(200, 200, 0, 0.25)';
      if (value >= 0.2) return 'rgba(255, 150, 0, 0.2)';
      return 'rgba(255, 0, 0, 0.2)';
    }
  };
  
  return (
    <div class={styles.chartContainer}>
      <h3>Result Similarity Matrix</h3>
      <p>
        This matrix shows how similar each result is to others, using Jaccard similarity index.
        Higher values (greener) indicate more similar results.
      </p>
      
      <div class={styles.similarityMatrix}>
        {props.results.length <= 1 ? (
          <div class={styles.noDataMessage}>
            Need multiple results to generate similarity matrix
          </div>
        ) : (
          <div class={styles.similarityGrid} style={{
            'grid-template-columns': `auto repeat(${Math.min(props.results.length, props.maxResults || 10)}, 1fr)`,
            'grid-template-rows': `auto repeat(${Math.min(props.results.length, props.maxResults || 10)}, 1fr)`
          }}>
            {/* Header row */}
            <div class={`${styles.similarityCell} ${styles.similarityHeaderCell}`}></div>
            {props.results.slice(0, props.maxResults || 10).map((_, i) => (
              <div class={`${styles.similarityCell} ${styles.similarityHeaderCell}`}>
                R{i+1}
              </div>
            ))}
            
            {/* Matrix cells */}
            {calculateSimilarityMatrix().map((row, rowIndex) => (
              <>
                {/* Row header */}
                <div class={`${styles.similarityCell} ${styles.similarityHeaderCell}`}>
                  R{rowIndex+1}
                </div>
                
                {/* Similarity values */}
                {row.map((similarity, colIndex) => (
                  <div 
                    class={styles.similarityCell} 
                    style={{ 'background-color': getSimilarityColor(similarity) }}
                    title={`Similarity between Result ${rowIndex+1} and Result ${colIndex+1}: ${(similarity * 100).toFixed(1)}%`}
                  >
                    {similarity === 1 ? '1.0' : similarity.toFixed(2)}
                  </div>
                ))}
              </>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 