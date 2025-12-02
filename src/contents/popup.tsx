/** biome-ignore-all lint/a11y/useKeyWithClickEvents: 需要阻止事件冒泡 */
import cssText from "data-text:~style.css";
import { sendToBackground } from "@plasmohq/messaging";
import { useDocumentVisibility } from "ahooks";
import type { IFuseOptions } from "fuse.js";
import Fuse from "fuse.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useSearchEngine } from "~hooks/useSearchEngine";
import { useTheme } from "~hooks/useTheme";
import { DEFAULT_OPTIONS, useUserOptions } from "~store/options";
import { Key } from "../key";
import type { BangShortcut, SearchResult } from "../type";
import SearchInput from "./components/searchInput";
import SearchList from "./components/searchList";

const { ArrowUp, ArrowDown, Enter, Escape, Shift, Control } = Key;

export function getStyle() {
  const style = document.createElement("style");
  style.textContent = cssText;
  style.setAttribute("data-moyu-search-style", "true");
  return style;
}

const fuseOptions: IFuseOptions<SearchResult> = {
  includeScore: true,
  useExtendedSearch: true,
  threshold: 0.3,
  keys: ["title", "url", "titlePinyin", "titlePinyinInitials"],
};

function getBangSearchUrl(bang: BangShortcut, query: string): string {
  return bang.searchUrl.replace("{query}", encodeURIComponent(query));
}

function Popup() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [bangMode, setBangMode] = useState<BangShortcut | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const isMoved = useRef(false);
  const fuseRef = useRef<Fuse<SearchResult> | null>(null);

  const { getSearchItem, getSearchUrl } = useSearchEngine();
  const [theme] = useTheme();
  const userOptions = useUserOptions();
  const documentVisibility = useDocumentVisibility();

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const handleSearch = (keyword: string) => {
    if (!keyword) return;
    if (!fuseRef.current) return;

    const searchResults = fuseRef.current.search(keyword);
    const seenTitle = new Set<string>();
    const tabs: SearchResult[] = [];
    const others: SearchResult[] = [];

    for (const { item } of searchResults) {
      const title = item.title || item.url;
      if (!seenTitle.has(title)) {
        seenTitle.add(title);
        if (item.type === "tab") {
          tabs.push(item);
        } else {
          others.push(item);
        }
      }
    }

    let newList = [...tabs, ...others];

    // 如果处于 bang mode，在列表开头添加 bang 搜索项
    if (bangMode && keyword.trim()) {
      const bangSearchItem: SearchResult = {
        type: "bang-search",
        id: `bang-search-${bangMode.keyword}`,
        title: `使用 ${bangMode.name} 进行搜索`,
        url: getBangSearchUrl(bangMode, keyword),
        bangMode,
      };
      newList = [bangSearchItem, ...newList];
    }

    if (newList.length === 0 && keyword.trim()) {
      const searchItem = getSearchItem(keyword);
      newList.push(searchItem);
    }

    setList(newList);
  };

  // -------- handler --------

  const handleDirectSearch = () => {
    const searchUrl = bangMode
      ? getBangSearchUrl(bangMode, searchQuery)
      : getSearchUrl(searchQuery);
    sendToBackground({
      name: "new-tab",
      body: { url: searchUrl },
    });
    handleClose();
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % list.length);
  };

  const loadRecentTabs = useCallback(async () => {
    try {
      const { results } = await sendToBackground({
        name: "get-recent-tabs",
      });
      setList(results);
    } catch (error) {
      console.error("Failed to load recent tabs:", error);
      setList([]);
    }
  }, []);

  const handleOpen = async () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSearchQuery("");
    setActiveIndex(0);
    setBangMode(null);
    isMoved.current = false;
  };

  // 新增：加载所有数据并初始化搜索
  const loadAllData = useCallback(async () => {
    try {
      const { results, fuseIndex } = await sendToBackground({
        name: "get-all",
        body: { forceRefresh: false },
      });

      if (fuseIndex) {
        const parsedIndex = Fuse.parseIndex(fuseIndex);
        fuseRef.current = new Fuse<SearchResult>(
          results,
          fuseOptions,
          parsedIndex,
        );
      } else {
        fuseRef.current = new Fuse<SearchResult>(results, fuseOptions);
      }
    } catch (error) {
      console.error("Failed to load all data:", error);
      // 如果加载失败，至少加载最近的标签页
      loadRecentTabs();
    }
  }, [loadRecentTabs]);

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    if (value) {
      handleSearch(value);
    } else {
      loadRecentTabs();
    }
  };

  const handleCtrlP = () => {
    if (open) {
      isMoved.current = true;
      handleNext();
    } else {
      handleOpen();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === Control && isMoved.current) {
      handleOpenResult();
    }
  };

  const handleOpenResult = (item?: SearchResult) => {
    const res = item || list[activeIndex];

    // 如果选中的是 bang 搜索项，直接使用 bang 搜索
    if (res.type === "bang-search" && res.bangMode) {
      const searchUrl = getBangSearchUrl(res.bangMode, searchQuery);
      sendToBackground({
        name: "new-tab",
        body: { url: searchUrl },
      });
    } else {
      // 其他情况都按照原逻辑处理，直接跳转到对应的 tab
      sendToBackground({
        name: "open-result",
        body: res,
      });
    }
    handleClose();
  };

  // -------- 快捷键 --------

  useHotkeys(Escape, handleClose, {
    enabled: open,
    preventDefault: true,
    enableOnFormTags: true,
    description: "关闭搜索框",
  });

  useHotkeys(ArrowDown, handleNext, {
    enabled: open,
    preventDefault: true,
    enableOnFormTags: true,
    description: "选择下一个结果",
  });

  useHotkeys(ArrowUp, handlePrev, {
    enabled: open,
    preventDefault: true,
    enableOnFormTags: true,
    description: "选择上一个结果",
  });

  useHotkeys(Enter, () => handleOpenResult(), {
    enabled: open,
    preventDefault: true,
    enableOnFormTags: true,
    description: "打开选中结果",
  });

  useHotkeys(`${Shift}+${Enter}`, handleDirectSearch, {
    enabled: open,
    preventDefault: true,
    enableOnFormTags: true,
    description: "直接使用搜索引擎搜索关键词",
  });

  // 可配置的快捷键处理
  useHotkeys(
    userOptions?.hotkey || DEFAULT_OPTIONS.hotkey,
    handleCtrlP,
    {
      document,
      enableOnFormTags: true,
      enableOnContentEditable: true,
      preventDefault: true,
      description:
        "打开搜索框继续按下则选择下一个，直到松开则打开结果，类似 vscode 的 cmd+p",
    },
    [open, list.length, userOptions?.hotkey],
  );

  useEffect(() => {
    if (documentVisibility === "visible") {
      loadRecentTabs();
      loadAllData();
    }
  }, [documentVisibility, loadRecentTabs, loadAllData]);

  return (
    <div
      className={`fixed left-0 top-0 w-screen h-screen z-[9999] ${theme}`}
      style={{ display: open ? "block" : "none" }}
      onClick={handleClose}
    >
      <div
        className={`
          absolute left-1/2 top-1/4 -translate-x-1/2 w-[700px] p-2 flex flex-col rounded-3xl shadow-2xl ${open ? "block" : "hidden"}
          bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <SearchInput
          ref={inputRef}
          value={searchQuery}
          bangMode={bangMode}
          onKeyUp={handleKeyUp}
          onBangModeChange={setBangMode}
          onChange={handleSearchQueryChange}
        />
        <SearchList
          list={list}
          searchQuery={searchQuery}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onItemClick={handleOpenResult}
        />
      </div>
    </div>
  );
}

export default Popup;
