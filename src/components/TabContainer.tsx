import { createSignal, createEffect, For, Show, JSX } from 'solid-js';
import styles from './DropoutVisualizer.module.css';

export interface Tab {
  id: string;
  label: string;
  content: JSX.Element;
}

interface TabContainerProps {
  tabs: Tab[];
  theme: 'light' | 'dark';
}

export default function TabContainer(props: TabContainerProps) {
  const [activeTab, setActiveTab] = createSignal<string>(props.tabs[0]?.id || '');

  // Update active tab if tabs change
  createEffect(() => {
    if (props.tabs.length > 0 && !props.tabs.some(tab => tab.id === activeTab())) {
      setActiveTab(props.tabs[0].id);
    }
  });

  const active = () => props.tabs.find(tab => tab.id === activeTab());

  return (
    <div class={styles.tabContainer}>
      <div class={styles.tabHeader}>
        <For each={props.tabs}>
          {(tab) => (
            <button
              class={`${styles.tabButton} ${activeTab() === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          )}
        </For>
      </div>
      
      <div class={styles.tabContent}>
        <Show when={active()}>
          {(tab) => (
            <div class={styles.tabPanel}>
              {tab().content}
            </div>
          )}
        </Show>
      </div>
    </div>
  );
} 