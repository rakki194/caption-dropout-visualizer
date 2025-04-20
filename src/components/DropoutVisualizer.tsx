import { createSignal, createEffect, For, Show } from 'solid-js';
import { applyCaptionDropout, simulateDropoutSteps } from '../utils/captionDropout';
import { fetchCaptionFiles, CaptionFile } from '../utils/datasetLoader';
import styles from './DropoutVisualizer.module.css';

export default function DropoutVisualizer() {
  const [datasetPath, setDatasetPath] = createSignal('/home/kade/diffusion/datasets/fd');
  const [dropoutRate, setDropoutRate] = createSignal(0.60);
  const [stepCount, setStepCount] = createSignal(1500);
  const [keepTokens, setKeepTokens] = createSignal(1);
  const [keepTokensSeparator, setKeepTokensSeparator] = createSignal('|||');
  const [captionSeparator, setCaptionSeparator] = createSignal(',');
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal('');
  const [captions, setCaptions] = createSignal<CaptionFile[]>([]);
  const [selectedCaption, setSelectedCaption] = createSignal<CaptionFile | null>(null);
  const [dropoutResults, setDropoutResults] = createSignal<string[]>([]);

  const loadCaptions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await fetchCaptionFiles(datasetPath());
      setCaptions(result.slice(0, 20)); // Limit to 20 captions for performance
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

  const handleDropoutVisualization = () => {
    if (!selectedCaption()) return;
    
    const caption = selectedCaption()!.caption;
    const results = simulateDropoutSteps(
      caption,
      dropoutRate(),
      stepCount(),
      keepTokens(),
      keepTokensSeparator(),
      captionSeparator()
    );
    
    setDropoutResults(results);
  };

  const handleSingleDropout = () => {
    if (!selectedCaption()) return;
    
    const caption = selectedCaption()!.caption;
    const result = applyCaptionDropout(
      caption,
      dropoutRate(),
      keepTokens(),
      keepTokensSeparator(),
      captionSeparator()
    );
    
    setDropoutResults([result]);
  };

  // Load captions when the component mounts
  createEffect(() => {
    loadCaptions();
  });

  // When a new caption is selected, clear previous results
  createEffect(() => {
    selectedCaption();
    setDropoutResults([]);
  });

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

        <div class={styles.settingGroup}>
          <label for="stepCount">Number of Steps:</label>
          <input
            id="stepCount"
            type="number"
            min="1"
            max="2000"
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
          <label for="captionSeparator">Caption Separator:</label>
          <input
            id="captionSeparator"
            type="text"
            value={captionSeparator()}
            onInput={(e) => setCaptionSeparator(e.target.value)}
          />
        </div>

        <div class={styles.buttonGroup}>
          <button onClick={handleSingleDropout} disabled={!selectedCaption()}>
            Run Single Dropout
          </button>
          <button onClick={handleDropoutVisualization} disabled={!selectedCaption()}>
            Visualize Dropout Steps
          </button>
        </div>
      </div>

      <Show when={error()}>
        <div class={styles.error}>{error()}</div>
      </Show>

      <div class={styles.captionSelector}>
        <h2>Select a Caption</h2>
        <div class={styles.captionList}>
          <For each={captions()}>
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
      </div>

      <Show when={selectedCaption()}>
        <div class={styles.originalCaption}>
          <h2>Original Caption</h2>
          <pre>{selectedCaption()?.caption}</pre>
        </div>
      </Show>

      <Show when={dropoutResults().length > 0}>
        <div class={styles.resultsContainer}>
          <h2>Dropout Results ({dropoutResults().length} step{dropoutResults().length > 1 ? 's' : ''})</h2>
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