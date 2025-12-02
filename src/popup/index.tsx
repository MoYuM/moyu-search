import { GithubFilled, QuestionCircleOutlined } from "@ant-design/icons";
import {
  Button,
  ConfigProvider,
  Divider,
  Form,
  Input,
  Layout,
  message,
  Select,
  Tooltip,
  Typography,
  theme,
} from "antd";
import { useEffect } from "react";
import { APPEARANCE_OPTIONS, SEARCH_ENGINE_OPTIONS } from "~const";
import { useTheme } from "~hooks/useTheme";
import type { UserOptions } from "~store/options";
import { setUserOptions, useUserOptions } from "~store/options";
import { t } from "~utils/i18n";
import { version } from "../../package.json";
import HotkeyInput from "./components/hotkeyInput";
import "./index.css";

const algorithmMap = {
  light: theme.defaultAlgorithm,
  dark: theme.darkAlgorithm,
};

const { Title } = Typography;

function validateHotkey(val: string) {
  if (!val) {
    return Promise.reject(new Error(t("hotkeyErrorNoKey")));
  }

  const keys = val.split("+");
  const modifierKeys = ["ctrl", "cmd", "alt", "shift", "meta"];
  const hasModifier = keys.some((key) => modifierKeys.includes(key));
  const hasNormalKey = keys.some((key) => !modifierKeys.includes(key));

  if (!hasModifier) {
    return Promise.reject(new Error(t("hotkeyErrorNoModifier")));
  }

  if (!hasNormalKey) {
    return Promise.reject(new Error(t("hotkeyErrorNoNormalKey")));
  }

  return Promise.resolve();
}

function IndexPopup() {
  const [form] = Form.useForm();
  const [theme] = useTheme();
  const userOptions = useUserOptions();

  useEffect(() => {
    if (userOptions && form) {
      form.setFieldsValue(userOptions);
    }
  }, [userOptions, form]);

  const handleFormChange = (
    changedValues: Partial<UserOptions>,
    allValues: UserOptions,
  ) => {
    if (changedValues.hotkey) {
      validateHotkey(changedValues.hotkey)
        .then(() => {
          setUserOptions(allValues);
        })
        .catch((err) => {
          message.error(err.message);
        });
    } else {
      setUserOptions(allValues);
    }
  };

  return (
    <ConfigProvider theme={{ algorithm: algorithmMap[theme] }}>
      <Layout className="w-[300px] min-h-[450px] max-h-[600px] p-4 overflow-y-auto">
        <div className="flex justify-between items-center">
          <Title level={5}>{t("settings")}</Title>
          <div className="text-sm text-gray-500">v{version}</div>
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
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t("basicConfig")}
          </div>
          <Form.Item
            label={t("searchEngine")}
            name="searchEngine"
            className="w-full"
          >
            <Select
              options={SEARCH_ENGINE_OPTIONS}
              placeholder={t("selectSearchEngine")}
            />
          </Form.Item>
          <Form.Item
            label={t("appearance")}
            name="appearance"
            className="w-full"
          >
            <Select
              options={APPEARANCE_OPTIONS}
              placeholder={t("selectAppearance")}
            />
          </Form.Item>
          <Form.Item
            label={t("hotkey")}
            name="hotkey"
            className="w-full"
            rules={[
              {
                validator: (_, val: string) => validateHotkey(val),
              },
            ]}
          >
            <HotkeyInput placeholder={t("clickToRecordHotkey")} />
          </Form.Item>

          <Divider size="small" />

          <div className="flex items-center gap-2 mb-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("bangMode")}
            </div>
            <Tooltip
              title={
                <div>
                  <div className="mb-2">{t("bangModeTooltipLine1")}</div>
                  <div>{t("bangModeTooltipLine2")}</div>
                </div>
              }
            >
              <QuestionCircleOutlined className="text-gray-400" />
            </Tooltip>
          </div>
          {Object.keys(userOptions?.bangConfig || {}).map((bangName) => (
            <Form.Item
              key={bangName}
              label={bangName}
              name={["bangConfig", bangName]}
              className="w-full"
            >
              <Input placeholder={t("bangKeywordPlaceholder")} />
            </Form.Item>
          ))}
        </Form>

        <Divider size="small" />

        <div className="mt-2">
          <div className="text-center text-xs text-gray-500">
            <span>{t("feedbackDescription")}</span>
            <Button
              icon={<GithubFilled />}
              size="small"
              type="link"
              href="https://github.com/MoYuM/moyu-search/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
            >
              {t("feedback")}
            </Button>
          </div>
        </div>
      </Layout>
    </ConfigProvider>
  );
}

export default IndexPopup;
