import Bookmark from "react:/assets/bookmark.svg";
import Box from "react:/assets/box.svg";
import Clock from "react:/assets/clock.svg";
import Search from "react:/assets/search.svg";
import { useControllableValue } from "ahooks";
import clsx from "clsx";
import type { ComponentType, FC, SVGProps } from "react";
import { useEffect, useRef } from "react";
import type { SearchResult } from "~type";
import FaviconImg from "./faviconImg";

export interface SearchListProps {
  list: SearchResult[];
  searchQuery: string;
  onItemClick: (item: SearchResult) => void;
  activeIndex: number;
  setActiveIndex: (active: number) => void;
}

export interface SearchListRef {
  resetActive: () => void;
}

const IconMap: Record<
  SearchResult["type"],
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  tab: Box,
  history: Clock,
  bookmark: Bookmark,
  search: Search,
  "bang-search": Search,
};

const SearchList: FC<SearchListProps> = (props) => {
  const { list, searchQuery, onItemClick } = props;

  const [activeIndex, setActiveIndex] = useControllableValue(props, {
    defaultValue: 0,
    valuePropName: "activeIndex",
    trigger: "setActiveIndex",
  });

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "instant",
      });
    }
  }, [activeIndex]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: 监控 searchQuery，当输入改变时，自动设置 activeIndex 为 0
  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  // 根据搜索结果类型获取图标
  const getResultIcon = (item: SearchResult) => {
    const Icon = IconMap[item.type];
    if (Icon) {
      return <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />;
    }
  };

  return (
    <div className="flex flex-col mt-2 overflow-y-auto rounded-xl h-96 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {list?.map((item, index) => (
        <div
          key={`${item.id}-${item.url}`}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          onKeyDown={() => onItemClick(item)}
          className={clsx(
            "flex items-center justify-between gap-2 px-3 py-2 rounded-2xl flex-none h-12 cursor-pointer transition-none",
            {
              "bg-zinc-200 dark:bg-zinc-700": index === activeIndex,
            },
          )}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <FaviconImg favicon={item.favicon} url={item.url} />
            <div className="truncate flex-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
              {item.title}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-400 select-none">
            {getResultIcon(item)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchList;
