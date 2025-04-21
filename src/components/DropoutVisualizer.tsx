import { createSignal, createEffect, For, Show, onMount } from 'solid-js';
import { 
  applyCaptionDropout, 
  simulateDropoutSteps, 
  shuffleCaption, 
  simulateShuffleSteps,
  applyBothDropoutAndShuffle,
  simulateBothOperationsSteps
} from '../utils/captionDropout';
import { processWolfCaption, splitWolfCaption } from '../utils/wolfCaptions';
import { fetchCaptionFiles, CaptionFile } from '../utils/datasetLoader';
import TokenFrequencyChart from './TokenFrequencyChart';
import TokenHeatmap from './TokenHeatmap';
import PositionAnalysisChart from './PositionAnalysisChart';
import TokenLengthAnalysis from './TokenLengthAnalysis';
import BeforeAfterComparison from './BeforeAfterComparison';
import SimilarityMatrix from './SimilarityMatrix';
import WordCloud from './WordCloud';
import TabContainer, { Tab } from './TabContainer';
import styles from './DropoutVisualizer.module.css';

function getTokenCount(caption: string, separator: string | string[]): number {
  if (Array.isArray(separator)) {
    let tokens = [caption];
    
    // Apply each separator sequentially
    for (const sep of separator) {
      const newTokens: string[] = [];
      for (const token of tokens) {
        newTokens.push(...token.split(sep));
      }
      tokens = newTokens;
    }
    
    return tokens.filter(token => token.trim()).length;
  }
  
  return caption.split(separator).filter(token => token.trim()).length;
}

function TokenStats(props: { 
  caption: string, 
  results: string[], 
  separator: string | string[],
  operation: 'dropout' | 'shuffle' | 'both'
}) {
  const originalCount = getTokenCount(props.caption, props.separator);
  
  // Calculate average token count across all results
  const avgCount = props.results.reduce((sum, result) => 
    sum + getTokenCount(result, props.separator), 0) / props.results.length;
  
  // Calculate token retention percentage
  const retentionPercent = (avgCount / originalCount) * 100;
  
  // Calculate unique token combinations (for shuffle)
  const uniqueResults = new Set(props.results).size;
  const uniquePercent = (uniqueResults / props.results.length) * 100;
  
  return (
    <div class={styles.tokenStats}>
      <div class={styles.statItem}>
        <div class={styles.statValue}>{originalCount}</div>
        <div class={styles.statLabel}>Original Token Count</div>
      </div>
      
      <div class={styles.statItem}>
        <div class={styles.statValue}>{avgCount.toFixed(1)}</div>
        <div class={styles.statLabel}>Average Token Count</div>
      </div>
      
      <div class={styles.statItem}>
        <div class={styles.statValue}>{retentionPercent.toFixed(1)}%</div>
        <div class={styles.statLabel}>
          {props.operation === 'dropout' ? 'Token Retention' : 'Token Consistency'}
        </div>
      </div>
      
      <Show when={props.operation === 'shuffle' || props.operation === 'both'}>
        <div class={styles.statItem}>
          <div class={styles.statValue}>{uniqueResults}</div>
          <div class={styles.statLabel}>Unique Variations</div>
        </div>
        
        <div class={styles.statItem}>
          <div class={styles.statValue}>{uniquePercent.toFixed(1)}%</div>
          <div class={styles.statLabel}>Uniqueness Rate</div>
        </div>
      </Show>
    </div>
  );
}

// Helper function to get the operation name for display
const getOperationName = (type: 'dropout' | 'shuffle' | 'both') => {
  switch (type) {
    case 'dropout': return 'Dropout';
    case 'shuffle': return 'Shuffle';
    case 'both': return 'Dropout+Shuffle';
    default: return 'Operation';
  }
};

export default function DropoutVisualizer() {
  const [datasetPath, setDatasetPath] = createSignal('/home/kade/diffusion/datasets/fd');
  const [dropoutRate, setDropoutRate] = createSignal(0.60);
  const [stepCount, setStepCount] = createSignal(50);
  const [keepTokens, setKeepTokens] = createSignal(1);
  const [keepTokensSeparator, setKeepTokensSeparator] = createSignal('|||');
  const [captionSeparators, setCaptionSeparators] = createSignal<string[]>([',']);
  const [newSeparator, setNewSeparator] = createSignal('');
  const [seed, setSeed] = createSignal<number | undefined>(undefined);
  const [useSeed, setUseSeed] = createSignal(false);
  const [operationType, setOperationType] = createSignal<'dropout' | 'shuffle' | 'both'>('dropout');
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal('');
  const [captions, setCaptions] = createSignal<CaptionFile[]>([]);
  const [selectedCaption, setSelectedCaption] = createSignal<CaptionFile | null>(null);
  const [dropoutResults, setDropoutResults] = createSignal<string[]>([]);
  const [theme, setTheme] = createSignal<'light' | 'dark' | 'system'>('system');
  const [isDarkMode, setIsDarkMode] = createSignal(false);
  const [showStats, setShowStats] = createSignal(false);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [itemsPerPage, setItemsPerPage] = createSignal(50);
  const [currentStep, setCurrentStep] = createSignal(0);
  const [useWolfCaptions, setUseWolfCaptions] = createSignal(false);

  // Function to detect system theme preference
  const detectSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Function to add a separator
  const addSeparator = () => {
    const separator = newSeparator().trim();
    if (separator && !captionSeparators().includes(separator)) {
      setCaptionSeparators([...captionSeparators(), separator]);
      setNewSeparator('');
    }
  };

  // Function to remove a separator
  const removeSeparator = (index: number) => {
    const separators = [...captionSeparators()];
    separators.splice(index, 1);
    if (separators.length === 0) {
      // Always keep at least one separator
      separators.push(',');
    }
    setCaptionSeparators(separators);
  };

  // Function to apply theme
  const applyTheme = () => {
    const effectiveTheme = theme() === 'system' ? detectSystemTheme() : theme();
    setIsDarkMode(effectiveTheme === 'dark');
    
    if (effectiveTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // Toggle theme function
  const toggleTheme = () => {
    const currentTheme = theme();
    let newTheme: 'light' | 'dark' | 'system';
    
    if (currentTheme === 'system') {
      newTheme = isDarkMode() ? 'light' : 'dark';
    } else if (currentTheme === 'light') {
      newTheme = 'dark';
    } else {
      newTheme = 'light';
    }
    
    setTheme(newTheme);
    localStorage.setItem('theme-preference', newTheme);
    applyTheme();
  };

  // Load saved theme from localStorage on mount
  onMount(() => {
    const savedTheme = localStorage.getItem('theme-preference') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    applyTheme();

    // Add listener for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme() === 'system') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  });

  const loadCaptions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await fetchCaptionFiles(datasetPath());
      setCaptions(result); // Remove the slice limit to get all captions
      setCurrentPage(1); // Reset to first page
      setIsLoading(false);
      if (result.length === 0) {
        setError('No caption files found in the specified path');
      } else {
        setSelectedCaption(result[0]);
      }
    } catch (err) {
      setIsLoading(false);
      setError(`Failed to load captions: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const preprocessCaption = (caption: string): string => {
    if (useWolfCaptions()) {
      return processWolfCaption(caption);
    }
    return caption;
  };

  const handleDropoutVisualization = () => {
    if (!selectedCaption()) return;
    
    let caption = selectedCaption()!.caption;
    if (useWolfCaptions()) {
      caption = processWolfCaption(caption);
    }
    
    const rawSeed = seed();
    const seedValue = useSeed() ? (rawSeed !== undefined ? Number(rawSeed) : undefined) : undefined;
    
    console.log('Using seed value:', seedValue, 'type:', typeof seedValue);
    
    let results;
    switch (operationType()) {
      case 'shuffle':
        results = simulateShuffleSteps(
          caption,
          stepCount(),
          keepTokens(),
          keepTokensSeparator(),
          captionSeparators(),
          seedValue
        );
        break;
      case 'both':
        results = simulateBothOperationsSteps(
          caption,
          dropoutRate(),
          stepCount(),
          keepTokens(),
          keepTokensSeparator(),
          captionSeparators(),
          seedValue
        );
        break;
      case 'dropout':
      default:
        results = simulateDropoutSteps(
          caption,
          dropoutRate(),
          stepCount(),
          keepTokens(),
          keepTokensSeparator(),
          captionSeparators(),
          seedValue
        );
        break;
    }
    
    setDropoutResults(results);
    
    setShowStats(true);
  };

  const handleSingleOperation = () => {
    if (!selectedCaption()) return;
    
    let caption = selectedCaption()!.caption;
    if (useWolfCaptions()) {
      caption = processWolfCaption(caption);
    }
    
    const rawSeed = seed();
    const seedValue = useSeed() ? (rawSeed !== undefined ? Number(rawSeed) : undefined) : undefined;
    
    console.log('Single operation using seed value:', seedValue, 'type:', typeof seedValue);
    
    let result;
    switch (operationType()) {
      case 'shuffle':
        result = shuffleCaption(
          caption,
          keepTokens(),
          keepTokensSeparator(),
          captionSeparators(),
          seedValue
        );
        break;
      case 'both':
        result = applyBothDropoutAndShuffle(
          caption,
          dropoutRate(),
          keepTokens(),
          keepTokensSeparator(),
          captionSeparators(),
          seedValue
        );
        break;
      case 'dropout':
      default:
        result = applyCaptionDropout(
          caption,
          dropoutRate(),
          keepTokens(),
          keepTokensSeparator(),
          captionSeparators(),
          seedValue
        );
        break;
    }
    
    setDropoutResults([result]);
    
    setShowStats(true);
  };

  const setRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
    setUseSeed(true);
  };

  // Load captions when the component mounts
  createEffect(() => {
    loadCaptions();
  });

  // When a new caption is selected, clear previous results
  createEffect(() => {
    selectedCaption();
    setDropoutResults([]);
    setShowStats(false);
  });

  // Get paginated captions
  const paginatedCaptions = () => {
    const allCaptions = captions();
    const page = currentPage();
    const perPage = itemsPerPage();
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return allCaptions.slice(start, end);
  };

  // Calculate total pages
  const totalPages = () => {
    return Math.ceil(captions().length / itemsPerPage());
  };

  // Change page
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages()) return;
    setCurrentPage(newPage);
  };

  return (
    <div class={styles.container}>
      <h1 class={styles.title}>Caption Dropout Visualizer</h1>
      
      <div class={styles.settings}>
        <div class={styles.settingGroup}>
          <label for="datasetPath">Dataset Path:</label>
          <input
            id="datasetPath"
            type="text"
            value={datasetPath()}
            onInput={(e) => setDatasetPath(e.target.value)}
            class={styles.pathInput}
          />
          <button onClick={loadCaptions} disabled={isLoading()}>
            {isLoading() ? 'Loading...' : 'Load Captions'}
          </button>
        </div>

        <div class={styles.settingGroup}>
          <label for="theme">Theme:</label>
          <div class={styles.themeSelector}>
            <button 
              class={`${styles.themeButton} ${theme() === 'light' ? styles.active : ''}`} 
              onClick={() => {
                setTheme('light');
                localStorage.setItem('theme-preference', 'light');
                applyTheme();
              }}
              title="Light mode"
            >
              ☀️ Light
            </button>
            <button 
              class={`${styles.themeButton} ${theme() === 'system' ? styles.active : ''}`} 
              onClick={() => {
                setTheme('system');
                localStorage.setItem('theme-preference', 'system');
                applyTheme();
              }}
              title="Use system preference"
            >
              🖥️ System
            </button>
            <button 
              class={`${styles.themeButton} ${theme() === 'dark' ? styles.active : ''}`} 
              onClick={() => {
                setTheme('dark');
                localStorage.setItem('theme-preference', 'dark');
                applyTheme();
              }}
              title="Dark mode"
            >
              🌙 Dark
            </button>
          </div>
        </div>

        <div class={styles.settingGroup}>
          <label for="operationType">Operation Type:</label>
          <div class={styles.toggleSwitch}>
            <button 
              class={`${styles.toggleButton} ${operationType() === 'dropout' ? styles.active : ''}`}
              onClick={() => setOperationType('dropout')}
            >
              Dropout
            </button>
            <button 
              class={`${styles.toggleButton} ${operationType() === 'shuffle' ? styles.active : ''}`}
              onClick={() => setOperationType('shuffle')}
            >
              Shuffle
            </button>
            <button 
              class={`${styles.toggleButton} ${operationType() === 'both' ? styles.active : ''}`}
              onClick={() => setOperationType('both')}
            >
              Both
            </button>
          </div>
        </div>

        <div class={styles.settingGroup}>
          <label for="useWolfCaptions">Wolf Captions:</label>
          <div class={styles.toggleSwitch}>
            <button 
              class={`${styles.toggleButton} ${!useWolfCaptions() ? styles.active : ''}`}
              onClick={() => setUseWolfCaptions(false)}
            >
              Standard
            </button>
            <button 
              class={`${styles.toggleButton} ${useWolfCaptions() ? styles.active : ''}`}
              onClick={() => setUseWolfCaptions(true)}
            >
              Wolf Captions (.«comma)
            </button>
          </div>
        </div>

        <Show when={useWolfCaptions()}>
          <div class={styles.helpText}>
            Wolf Captions mode adds a comma after each sentence-ending period while preserving common abbreviations.
            This enables better sentence boundary detection for training.
          </div>
        </Show>

        <Show when={operationType() !== 'shuffle'}>
          <div class={styles.settingGroup}>
            <label for="dropoutRate">Dropout Rate:</label>
            <input
              id="dropoutRate"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={dropoutRate()}
              onInput={(e) => setDropoutRate(parseFloat(e.target.value))}
            />
            <span>{dropoutRate().toFixed(2)}</span>
          </div>
        </Show>

        <div class={styles.settingGroup}>
          <label for="stepCount">Number of Steps:</label>
          <input
            id="stepCount"
            type="number"
            min="1"
            value={stepCount()}
            onInput={(e) => setStepCount(parseInt(e.target.value))}
          />
        </div>

        <div class={styles.settingGroup}>
          <label for="keepTokens">Keep Tokens:</label>
          <input
            id="keepTokens"
            type="number"
            min="0"
            value={keepTokens()}
            onInput={(e) => setKeepTokens(parseInt(e.target.value))}
          />
        </div>

        <div class={styles.settingGroup}>
          <label for="keepTokensSeparator">Keep Tokens Separator:</label>
          <input
            id="keepTokensSeparator"
            type="text"
            value={keepTokensSeparator()}
            onInput={(e) => setKeepTokensSeparator(e.target.value)}
          />
        </div>

        <div class={styles.settingGroup}>
          <label>Caption Separators:</label>
          <div class={styles.separatorsList}>
            <For each={captionSeparators()}>
              {(separator, index) => (
                <div class={styles.separatorItem}>
                  <span class={styles.separatorText}>"{separator}"</span>
                  <button 
                    class={styles.separatorRemoveBtn}
                    onClick={() => removeSeparator(index())}
                    disabled={captionSeparators().length === 1}
                    title="Remove separator"
                  >
                    ✕
                  </button>
                </div>
              )}
            </For>
            <div class={styles.addSeparatorControl}>
              <input
                type="text"
                value={newSeparator()}
                onInput={(e) => setNewSeparator(e.target.value)}
                placeholder="Add new separator"
              />
              <button 
                onClick={addSeparator}
                disabled={!newSeparator().trim()}
                title="Add separator"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div class={styles.settingGroup}>
          <label for="useSeed">Use Seed:</label>
          <div class={styles.seedControls}>
            <input
              id="useSeed"
              type="checkbox"
              checked={useSeed()}
              onChange={(e) => setUseSeed(e.target.checked)}
            />
            <input
              type="number"
              value={seed() !== undefined ? seed() : ''}
              onInput={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setSeed(undefined);
                } else {
                  setSeed(Number(val));
                  console.log('Seed set to:', Number(val), 'type:', typeof Number(val));
                }
              }}
              disabled={!useSeed()}
              placeholder="Enter seed"
            />
            <button 
              onClick={setRandomSeed}
              title="Generate random seed"
              class={styles.seedButton}
              disabled={!useSeed()}
            >
              🎲
            </button>
          </div>
        </div>

        <div class={styles.buttonGroup}>
          <button onClick={handleSingleOperation} disabled={!selectedCaption()}>
            Run Single {getOperationName(operationType())}
          </button>
          <button onClick={handleDropoutVisualization} disabled={!selectedCaption()}>
            Visualize {getOperationName(operationType())} Steps
          </button>
        </div>
      </div>

      <Show when={error()}>
        <div class={styles.error}>{error()}</div>
      </Show>

      <div class={styles.captionSelector}>
        <h2>
          Select a Caption 
          <span class={styles.captionCount}>
            ({captions().length} captions found)
          </span>
        </h2>
        <div class={styles.captionList}>
          <For each={paginatedCaptions()}>
            {(caption) => (
              <div
                class={`${styles.captionItem} ${selectedCaption() === caption ? styles.selected : ''}`}
                onClick={() => setSelectedCaption(caption)}
              >
                <div class={styles.fileName}>{caption.folder}/{caption.fileName}</div>
                <div class={styles.captionPreview}>
                  {caption.caption.length > 100
                    ? `${caption.caption.substring(0, 100)}...`
                    : caption.caption}
                </div>
              </div>
            )}
          </For>
        </div>

        <Show when={totalPages() > 1}>
          <div class={styles.pagination}>
            <button 
              onClick={() => changePage(1)} 
              disabled={currentPage() === 1}
              title="First page"
            >
              &laquo;
            </button>
            <button 
              onClick={() => changePage(currentPage() - 1)} 
              disabled={currentPage() === 1}
              title="Previous page"
            >
              &lsaquo;
            </button>
            <span class={styles.pageInfo}>
              Page {currentPage()} of {totalPages()}
            </span>
            <button 
              onClick={() => changePage(currentPage() + 1)} 
              disabled={currentPage() === totalPages()}
              title="Next page"
            >
              &rsaquo;
            </button>
            <button 
              onClick={() => changePage(totalPages())} 
              disabled={currentPage() === totalPages()}
              title="Last page"
            >
              &raquo;
            </button>
          </div>
        </Show>
      </div>

      <Show when={selectedCaption() && useWolfCaptions()}>
        <div class={styles.originalCaption}>
          <h2>Original Caption</h2>
          <pre>{selectedCaption()?.caption}</pre>
          
          <h3>Wolf Caption (With Sentence Separators)</h3>
          <pre class={styles.wolfCaption}>{processWolfCaption(selectedCaption()!.caption)}</pre>
        </div>
      </Show>

      <Show when={selectedCaption() && !useWolfCaptions()}>
        <div class={styles.originalCaption}>
          <h2>Original Caption</h2>
          <pre>{selectedCaption()?.caption}</pre>
        </div>
      </Show>

      <Show when={dropoutResults().length > 0}>
        <div class={styles.resultsContainer}>
          <h2>{getOperationName(operationType())} Results ({dropoutResults().length} step{dropoutResults().length > 1 ? 's' : ''})</h2>
          
          <Show when={showStats() && selectedCaption()}>
            <TokenStats 
              caption={selectedCaption()!.caption}
              results={dropoutResults()}
              separator={captionSeparators()}
              operation={operationType()}
            />
            
            <Show when={dropoutResults().length > 1}>
              <TabContainer
                theme={isDarkMode() ? 'dark' : 'light'}
                tabs={[
                  {
                    id: 'frequency',
                    label: 'Token Frequency',
                    content: (
                      <TokenFrequencyChart
                        caption={selectedCaption()!.caption}
                        results={dropoutResults()}
                        separator={captionSeparators()[0]}
                        theme={isDarkMode() ? 'dark' : 'light'}
                      />
                    )
                  },
                  {
                    id: 'heatmap',
                    label: 'Presence Heatmap',
                    content: (
                      <TokenHeatmap
                        caption={selectedCaption()!.caption}
                        results={dropoutResults()}
                        separator={captionSeparators()[0]}
                        theme={isDarkMode() ? 'dark' : 'light'}
                      />
                    )
                  },
                  {
                    id: 'position',
                    label: 'Position Analysis',
                    content: (
                      <PositionAnalysisChart
                        caption={selectedCaption()!.caption}
                        results={dropoutResults()}
                        separator={captionSeparators()[0]}
                        theme={isDarkMode() ? 'dark' : 'light'}
                      />
                    )
                  },
                  {
                    id: 'length',
                    label: 'Token Length',
                    content: (
                      <TokenLengthAnalysis
                        caption={selectedCaption()!.caption}
                        results={dropoutResults()}
                        separator={captionSeparators()[0]}
                        theme={isDarkMode() ? 'dark' : 'light'}
                      />
                    )
                  },
                  {
                    id: 'similarity',
                    label: 'Similarity Matrix',
                    content: (
                      <SimilarityMatrix
                        results={dropoutResults()}
                        separator={captionSeparators()[0]}
                        theme={isDarkMode() ? 'dark' : 'light'}
                        maxResults={10}
                      />
                    )
                  },
                  {
                    id: 'wordcloud',
                    label: 'Word Cloud',
                    content: (
                      <WordCloud
                        caption={selectedCaption()!.caption}
                        results={dropoutResults()}
                        separator={captionSeparators()[0]}
                        theme={isDarkMode() ? 'dark' : 'light'}
                      />
                    )
                  }
                ]}
              />
            </Show>
          </Show>
          
          <div class={styles.pagination}>
            <button onClick={() => setCurrentStep(0)} disabled={currentStep() === 0} title="First Step">First</button>
            <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep() === 0}>&lt; Prev</button>
            <span class={styles.pageInfo}>
              Step
              <input
                type="number"
                min={1}
                max={dropoutResults().length}
                value={currentStep() + 1}
                style={{ width: '4em', 'margin': '0 0.5em' }}
                onInput={e => {
                  const val = parseInt(e.currentTarget.value);
                  if (!isNaN(val) && val >= 1 && val <= dropoutResults().length) {
                    setCurrentStep(val - 1);
                  }
                }}
              />
              / {dropoutResults().length}
            </span>
            <button onClick={() => setCurrentStep(s => Math.min(dropoutResults().length - 1, s + 1))} disabled={currentStep() === dropoutResults().length - 1}>Next &gt;</button>
            <button onClick={() => setCurrentStep(dropoutResults().length - 1)} disabled={currentStep() === dropoutResults().length - 1} title="Last Step">Last</button>
          </div>
          
          <div style={{ "margin-top": "1.5rem", "border-top": "1px dashed #ccc", "padding-top": "1rem" }}>
            <BeforeAfterComparison
              caption={selectedCaption()!.caption}
              result={dropoutResults()[currentStep()]}
              separator={captionSeparators()[0]}
              theme={isDarkMode() ? 'dark' : 'light'}
            />
          </div>
          
          <For each={dropoutResults()}>
            {(result, index) => (
              <div class={styles.resultItem}>
                <div class={styles.resultHeader}>Step {index() + 1}</div>
                <pre>{result}</pre>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
} 