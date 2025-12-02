import type { InputRef } from "antd";
import { Input } from "antd";
import { useEffect, useRef, useState } from "react";
import { useRecordHotkeys } from "react-hotkeys-hook";
import { t } from "~utils/i18n";

interface HotkeyInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const HotkeyInput: React.FC<HotkeyInputProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const inputRef = useRef<InputRef>(null);
  // 内部状态管理显示值
  const [displayValue, setDisplayValue] = useState(value || "");

  // 使用 useRecordHotkeys 录制快捷键
  const [keys, { start, stop, resetKeys, isRecording }] = useRecordHotkeys();

  // 同步外部 value 到内部状态
  useEffect(() => {
    setDisplayValue(value || "");
  }, [value]);

  // 处理录制结果 - 只在录制完成时更新
  useEffect(() => {
    const keyList = Array.from(keys);

    // 只在录制完成且有按键时更新显示值
    if (keyList.length > 0 && !isRecording) {
      const newValue = keyList.join("+");
      setDisplayValue(newValue);
      // 录制完成时同步到表单
      onChange?.(newValue);
    }
  }, [keys, isRecording, onChange]);

  // 点击 input 开始录制
  const handleInputClick = () => {
    if (!isRecording) {
      resetKeys();
      start();
    }
  };

  // 监听按键抬起事件，自动停止录制
  useEffect(() => {
    const handleKeyUp = () => {
      if (isRecording) {
        stop();
      }
    };

    if (isRecording) {
      document.addEventListener("keyup", handleKeyUp);
      return () => document.removeEventListener("keyup", handleKeyUp);
    }
  }, [isRecording, stop]);

  return (
    <Input
      ref={inputRef}
      value={displayValue}
      placeholder={isRecording ? t("recordingHotkey") : placeholder}
      readOnly
      onClick={handleInputClick}
      onBlur={stop}
      className={`cursor-pointer ${isRecording ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
      style={{
        backgroundColor: isRecording ? "#eff6ff" : undefined,
        borderColor: isRecording ? "#3b82f6" : undefined,
        color: isRecording ? "#1e40af" : undefined,
        fontWeight: isRecording ? "600" : undefined,
      }}
    />
  );
};

export default HotkeyInput;
