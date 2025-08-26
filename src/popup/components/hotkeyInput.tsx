import { Button, Input, Space } from 'antd'
import { useEffect } from 'react'
import { useRecordHotkeys } from 'react-hotkeys-hook'
import { t } from '~utils/i18n'

interface HotkeyInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

/**
 * 验证快捷键是否有效
 * @param hotkeyString 快捷键字符串
 * @returns 是否有效
 */
export function isValidHotkey(hotkeyString: string[]): boolean {
  if (!hotkeyString)
    return false

  const keys = hotkeyString.map(key => key.toLowerCase())

  // 至少需要一个修饰键和一个功能键
  if (keys.length < 2)
    return false

  const modifierKeys = ['ctrl', 'cmd', 'alt', 'shift', 'meta']
  const hasModifier = keys.some(key => modifierKeys.includes(key))

  if (!hasModifier)
    return false

  return true
}

const HotkeyInput: React.FC<HotkeyInputProps> = ({ value, onChange, placeholder }) => {
  // 使用 useRecordHotkeys 录制快捷键
  const [keys, { start, stop, resetKeys, isRecording }] = useRecordHotkeys()

  // 处理录制结果
  const handleRecordingResult = (hotkeyString: string[]) => {
    if (isValidHotkey(hotkeyString)) {
      onChange?.(hotkeyString.join('+'))
    }
  }

  // 处理录制结果
  useEffect(() => {
    // 当录制完成且有按键时，处理结果
    if (keys.size > 0 && isRecording) {
      handleRecordingResult(Array.from(keys))
    }
  }, [keys, isRecording])

  // 开始录制
  const handleStartRecording = () => {
    resetKeys()
    start()
  }

  // 停止录制
  const handleStopRecording = () => {
    stop()
  }

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        value={value}
        placeholder={placeholder}
        readOnly
      />
      {isRecording
        ? (
            <Button
              type="primary"
              danger
              onClick={handleStopRecording}
            >
              {t('confirmHotkey')}
            </Button>
          )
        : (
            <Button
              type="primary"
              onClick={handleStartRecording}
            >
              {t('recordHotkey')}
            </Button>
          )}
    </Space.Compact>
  )
}

export default HotkeyInput
