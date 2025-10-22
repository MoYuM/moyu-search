import type { BangShortcut } from '~type'
import { Button, Form, Input, List, message, Modal } from 'antd'
import { useState } from 'react'
import { setUserOptions, useUserOptions } from '~store/options'
import { t } from '~utils/i18n'

interface BangShortcutsConfigProps {
  className?: string
}

interface BangFormData {
  keyword: string
  name: string
  searchUrl: string
}

function BangShortcutsConfig({ className }: BangShortcutsConfigProps) {
  const userOptions = useUserOptions()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form] = Form.useForm<BangFormData>()

  const bangShortcuts = userOptions?.bangShortcuts || []

  const handleAdd = () => {
    setEditingIndex(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (index: number) => {
    const bang = bangShortcuts[index]
    setEditingIndex(index)
    form.setFieldsValue({
      keyword: bang.keyword,
      name: bang.name,
      searchUrl: bang.searchUrl,
    })
    setIsModalVisible(true)
  }

  const handleDelete = (index: number) => {
    const newShortcuts = bangShortcuts.filter((_, i) => i !== index)
    const newOptions = { ...userOptions, bangShortcuts: newShortcuts }
    setUserOptions(newOptions)
    message.success(`${t('bangDelete')} ${t('success')}`)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      // 验证关键词不重复（编辑时排除当前项）
      const isDuplicate = bangShortcuts.some((bang, index) =>
        bang.keyword === values.keyword && index !== editingIndex,
      )

      if (isDuplicate) {
        message.error(t('bangValidateKeywordDuplicate'))
        return
      }

      const newBang: BangShortcut = {
        keyword: values.keyword,
        name: values.name,
        searchUrl: values.searchUrl,
      }

      let newShortcuts: BangShortcut[]
      if (editingIndex !== null) {
        // 编辑模式
        newShortcuts = bangShortcuts.map((bang, index) =>
          index === editingIndex ? newBang : bang,
        )
      }
      else {
        // 添加模式
        newShortcuts = [...bangShortcuts, newBang]
      }

      const newOptions = { ...userOptions, bangShortcuts: newShortcuts }
      setUserOptions(newOptions)
      setIsModalVisible(false)
      form.resetFields()

      message.success(editingIndex !== null ? `${t('bangEdit')} ${t('success')}` : `${t('bangAdd')} ${t('success')}`)
    }
    catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 m-0">
          {t('bangShortcuts')}
        </h4>
        <Button
          type="primary"
          size="small"
          onClick={handleAdd}
        >
          {t('bangAdd')}
        </Button>
      </div>

      <List
        size="small"
        dataSource={bangShortcuts}
        locale={{ emptyText: '暂无快捷方式' }}
        renderItem={(bang, index) => (
          <List.Item
            actions={[
              <Button
                key="edit"
                type="link"
                size="small"
                onClick={() => handleEdit(index)}
              >
                {t('bangEdit')}
              </Button>,
              <Button
                key="delete"
                type="link"
                size="small"
                danger
                onClick={() => handleDelete(index)}
              >
                {t('bangDelete')}
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={(
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {bang.keyword}
                  </span>
                  <span className="text-sm font-medium">{bang.name}</span>
                </div>
              )}
              description={(
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {bang.searchUrl}
                </div>
              )}
            />
          </List.Item>
        )}
      />

      <Modal
        title={editingIndex !== null ? t('bangEdit') : t('bangAdd')}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={400}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          size="small"
        >
          <Form.Item
            label={t('bangKeyword')}
            name="keyword"
            rules={[
              { required: true, message: t('bangValidateKeywordEmpty') },
              {
                validator: (_, value) => {
                  if (!value)
                    return Promise.resolve()
                  const isDuplicate = bangShortcuts.some((bang, index) =>
                    bang.keyword === value && index !== editingIndex,
                  )
                  if (isDuplicate) {
                    return Promise.reject(new Error(t('bangValidateKeywordDuplicate')))
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input
              placeholder={t('bangKeywordPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            label={t('bangName')}
            name="name"
            rules={[{ required: true, message: t('bangValidateUrlEmpty') }]}
          >
            <Input
              placeholder={t('bangNamePlaceholder')}
            />
          </Form.Item>

          <Form.Item
            label={t('bangSearchUrl')}
            name="searchUrl"
            rules={[
              { required: true, message: t('bangValidateUrlEmpty') },
              {
                validator: (_, value) => {
                  if (!value)
                    return Promise.resolve()
                  if (!value.includes('{query}')) {
                    return Promise.reject(new Error(t('bangValidateUrlNoPlaceholder')))
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input.TextArea
              placeholder={t('bangUrlPlaceholder')}
              rows={2}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default BangShortcutsConfig
