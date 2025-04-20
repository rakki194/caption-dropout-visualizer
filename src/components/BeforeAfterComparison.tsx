import { createSignal, createEffect, For } from 'solid-js';
import styles from './DropoutVisualizer.module.css';

interface BeforeAfterComparisonProps {
  caption: string;
  result: string;
  separator: string;
  theme: 'light' | 'dark';
}

export default function BeforeAfterComparison(props: BeforeAfterComparisonProps) {
  // Split the captions into tokens
  const getTokenizedCaption = () => {
    // Original caption tokens
    const originalTokens = props.caption
      .split(props.separator)
      .map(t => t.trim())
      .filter(Boolean);
    
    // Result tokens
    const resultTokens = props.result
      .split(props.separator)
      .map(t => t.trim())
      .filter(Boolean);
    
    // Create a set of result tokens for quick lookups
    const resultTokenSet = new Set(resultTokens);
    
    // Categorize original tokens as kept or dropped
    const categorizedOriginalTokens = originalTokens.map(token => ({
      token,
      kept: resultTokenSet.has(token)
    }));
    
    // Identify tokens that are in the result but not in the original (for shuffle operations)
    const newTokens = resultTokens.filter(token => !originalTokens.includes(token));
    
    return {
      originalTokens: categorizedOriginalTokens,
      resultTokens,
      newTokens
    };
  };
  
  // For switching between result examples when multiple are available
  const [selectedResultIndex, setSelectedResultIndex] = createSignal(0);
  
  // Get tokens for the selected result
  const tokenData = () => getTokenizedCaption();
  
  // Custom styles for token display
  const getTokenStyle = (kept: boolean) => {
    const isDark = props.theme === 'dark';
    
    if (kept) {
      return {
        "background-color": isDark ? "#1e4620" : "#d4edda",
        "color": isDark ? "#8efa8e" : "#155724",
        "border": `1px solid ${isDark ? "#2a6d31" : "#c3e6cb"}`,
        "padding": "2px 5px",
        "margin": "2px",
        "border-radius": "4px",
        "display": "inline-block"
      };
    } else {
      return {
        "background-color": isDark ? "#491217" : "#f8d7da",
        "color": isDark ? "#ff8086" : "#721c24",
        "border": `1px solid ${isDark ? "#72181f" : "#f5c6cb"}`,
        "padding": "2px 5px",
        "margin": "2px",
        "border-radius": "4px",
        "display": "inline-block",
        "text-decoration": "line-through"
      };
    }
  };
  
  const getNewTokenStyle = () => {
    const isDark = props.theme === 'dark';
    
    return {
      "background-color": isDark ? "#1e3a5f" : "#cce5ff",
      "color": isDark ? "#73b2ff" : "#004085",
      "border": `1px solid ${isDark ? "#2a5285" : "#b8daff"}`,
      "padding": "2px 5px",
      "margin": "2px",
      "border-radius": "4px",
      "display": "inline-block",
      "font-style": "italic"
    };
  };
  
  const calculateStats = () => {
    const data = tokenData();
    const totalOriginal = data.originalTokens.length;
    const keptCount = data.originalTokens.filter(t => t.kept).length;
    const droppedCount = totalOriginal - keptCount;
    const newCount = data.newTokens.length;
    
    return {
      totalOriginal,
      keptCount,
      droppedCount,
      keptPercent: totalOriginal > 0 ? Math.round((keptCount / totalOriginal) * 100) : 0,
      droppedPercent: totalOriginal > 0 ? Math.round((droppedCount / totalOriginal) * 100) : 0,
      newCount
    };
  };
  
  return (
    <div class={styles.chartContainer} style={{ "height": "auto", "min-height": "200px", "max-height": "none" }}>
      <h3>Before & After Comparison</h3>
      <p>Visual comparison of tokens that were kept or dropped.</p>
      
      <div class={styles.comparisonStats}>
        <div class={styles.statItem}>
          <div class={styles.statValue}>{calculateStats().totalOriginal}</div>
          <div class={styles.statLabel}>Original Token Count</div>
        </div>
        
        <div class={styles.statItem}>
          <div class={styles.statValue}>{calculateStats().keptCount} ({calculateStats().keptPercent}%)</div>
          <div class={styles.statLabel}>Tokens Kept</div>
        </div>
        
        <div class={styles.statItem}>
          <div class={styles.statValue}>{calculateStats().droppedCount} ({calculateStats().droppedPercent}%)</div>
          <div class={styles.statLabel}>Tokens Dropped</div>
        </div>
        
        <div class={styles.statItem}>
          <div class={styles.statValue}>{calculateStats().newCount}</div>
          <div class={styles.statLabel}>New Tokens</div>
        </div>
      </div>
      
      <div class={styles.tokensContainer} style={{ "margin-top": "20px" }}>
        <div class={styles.tokenSection}>
          <h4>Original Caption</h4>
          <div class={styles.tokenList} style={{ "max-height": "150px", "overflow-y": "auto" }}>
            <For each={tokenData().originalTokens}>
              {(item) => (
                <span style={getTokenStyle(item.kept)}>{item.token}</span>
              )}
            </For>
          </div>
        </div>
        
        <div class={styles.tokenSection}>
          <h4>Result</h4>
          <div class={styles.tokenList} style={{ "max-height": "150px", "overflow-y": "auto" }}>
            <For each={tokenData().resultTokens}>
              {(token) => {
                const isNew = !tokenData().originalTokens.some(t => t.token === token);
                return (
                  <span style={isNew ? getNewTokenStyle() : getTokenStyle(true)}>
                    {token}{isNew ? ' (new)' : ''}
                  </span>
                );
              }}
            </For>
          </div>
        </div>
      </div>
      
      <div class={styles.tokenLegend}>
        <div class={styles.legendItem}>
          <span style={getTokenStyle(true)}>Example</span>
          <span>Kept Token</span>
        </div>
        <div class={styles.legendItem}>
          <span style={getTokenStyle(false)}>Example</span>
          <span>Dropped Token</span>
        </div>
        <div class={styles.legendItem}>
          <span style={getNewTokenStyle()}>Example</span>
          <span>New Token (from shuffling)</span>
        </div>
      </div>
    </div>
  );
} 