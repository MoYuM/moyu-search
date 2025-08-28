import { ConfigProvider, Divider, Form, Layout, Select, theme, Typography } from 'antd'
import { useEffect } from 'react'
import { APPEARANCE_OPTIONS, SEARCH_ENGINE_OPTIONS } from '~const'
import { useTheme } from '~hooks/useTheme'
import { getUserOptions, setUserOptions } from '~store/options'
import { t } from '~utils/i18n'
import { version } from '../../package.json'
import HotkeyInput from './components/hotkeyInput'
import './index.css'

const algorithmMap = {
  light: theme.defaultAlgorithm,
  dark: theme.darkAlgorithm,
}

const { Title } = Typography

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
    // 热键录制完成时，直接更新选项
    if (changedValues.hotkey !== undefined) {
      setUserOptions(allValues)
    }
  }

  return (
    <ConfigProvider theme={{ algorithm: algorithmMap[theme] }}>
      <Layout className="w-[300px] h-[450px] p-4">
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
              validator: (_, val: string) => {
                if (!val) {
                  return Promise.reject(new Error('请按下快捷键以进行录制'))
                }

                const keys = val.split('+')
                const modifierKeys = ['ctrl', 'cmd', 'alt', 'shift', 'meta']
                const hasModifier = keys.some(key => modifierKeys.includes(key))
                const hasNormalKey = keys.some(key => !modifierKeys.includes(key))

                if (!hasModifier) {
                  return Promise.reject(new Error('至少需要一个修饰键'))
                }

                if (!hasNormalKey) {
                  return Promise.reject(new Error('至少有一个功能键'))
                }

                return Promise.resolve()
              },
            }]}
          >
            <HotkeyInput
              placeholder={t('clickToRecordHotkey')}
            />
          </Form.Item>
        </Form>
      </Layout>
    </ConfigProvider>
  )
}

export default IndexPopup
