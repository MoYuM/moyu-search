import { ConfigProvider, Divider, Form, Layout, message, Select, theme, Typography } from 'antd'
import { useEffect } from 'react'
import { APPEARANCE_OPTIONS, SEARCH_ENGINE_OPTIONS } from '~const'
import { useTheme } from '~hooks/useTheme'
import { getUserOptions, setUserOptions } from '~store/options'
import { t } from '~utils/i18n'
import { version } from '../../package.json'
import BangShortcutsConfig from './components/bangShortcutsConfig'
import HotkeyInput from './components/hotkeyInput'
import './index.css'

const algorithmMap = {
  light: theme.defaultAlgorithm,
  dark: theme.darkAlgorithm,
}

const { Title } = Typography

function validateHotkey(val: string) {
  if (!val) {
    return Promise.reject(new Error(t('hotkeyErrorNoKey')))
  }

  const keys = val.split('+')
  const modifierKeys = ['ctrl', 'cmd', 'alt', 'shift', 'meta']
  const hasModifier = keys.some(key => modifierKeys.includes(key))
  const hasNormalKey = keys.some(key => !modifierKeys.includes(key))

  if (!hasModifier) {
    return Promise.reject(new Error(t('hotkeyErrorNoModifier')))
  }

  if (!hasNormalKey) {
    return Promise.reject(new Error(t('hotkeyErrorNoNormalKey')))
  }

  return Promise.resolve()
}

function IndexPopup() {
  const [form] = Form.useForm()
  const [theme] = useTheme()

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const userOptions = await getUserOptions()
    form.setFieldsValue(userOptions)
  }

  const handleFormChange = (changedValues: any, allValues: any) => {
    if (changedValues.hotkey) {
      validateHotkey(changedValues.hotkey).then(() => {
        setUserOptions(allValues)
      }).catch((err) => {
        message.error(err.message)
      })
    }
    else {
      setUserOptions(allValues)
    }
  }

  return (
    <ConfigProvider theme={{ algorithm: algorithmMap[theme] }}>
      <Layout className="w-[300px] min-h-[450px] max-h-[600px] p-4 overflow-y-auto">
        <div className="flex justify-between items-center">
          <Title level={5}>{t('settings')}</Title>
          <div className="text-sm text-gray-500">
            v
            {version}
          </div>
        </div>
        <Divider size="small" />
        <Form
          form={form}
          layout="inline"
          size="small"
          labelCol={{ span: 10 }}
          wrapperCol={{ span: 14 }}
          onValuesChange={handleFormChange}
        >
          <Form.Item label={t('searchEngine')} name="searchEngine" className="w-full">
            <Select
              options={SEARCH_ENGINE_OPTIONS}
              placeholder={t('selectSearchEngine')}
            />
          </Form.Item>
          <Form.Item label={t('appearance')} name="appearance" className="w-full">
            <Select
              options={APPEARANCE_OPTIONS}
              placeholder={t('selectAppearance')}
            />
          </Form.Item>
          <Form.Item
            label={t('hotkey')}
            name="hotkey"
            className="w-full"
            rules={[{
              validator: (_, val: string) => validateHotkey(val),
            }]}
          >
            <HotkeyInput
              placeholder={t('clickToRecordHotkey')}
            />
          </Form.Item>
        </Form>
        <Divider size="small" />
        <BangShortcutsConfig />
      </Layout>
    </ConfigProvider>
  )
}

export default IndexPopup
