import type {
  BarcodeScanningResult,
  CameraRecordingOptions,
} from "expo-camera/next";
import {
  CameraView,
  useCameraPermissions,
  BarcodePoint,
} from "expo-camera/next";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Dimensions, Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { CameraType } from "expo-camera";

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

interface IScannerRectangle {
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  ratio?: IntRange<1, 101>;
}

interface IQRCodeProps {
  onCodeScanned?: (code: string) => void;
  onScannerError?: (errorType: TScannerError) => void;
  stopWhenScanned?: boolean;
  scannerRectangle?: IScannerRectangle;
  debugMode?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface IQRScannerRef {
  pauseScanner: () => void;
  resumeScanner: (options?: CameraRecordingOptions) => void;
  isScannerReady: () => boolean;
  startCamera: () => Promise<boolean>;
}

type TDebugRect = {
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

export enum EScannerError {
  PermissionError = "NoPermission",
  MountError = "MountError",
  PlatformError = "PlatformError",
}

export type TScannerError = {
  type: EScannerError;
  msg: string;
};

const cameraRadio = Platform.OS === "ios" ? 9 / 16 : 3 / 4;
const ScreenWidth = Dimensions.get('screen').width
const ScreenHeight = Dimensions.get('screen').height

const QRCodeScanner = forwardRef<IQRScannerRef, IQRCodeProps>((props, ref) => {
  const cameraRef = useRef<CameraView | null>(null);
  const scanedRef = useRef<boolean>(false);

  const [webEnable, setWebEnable] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [debugRect, setDebugRect] = useState<TDebugRect>(null);

  useEffect(() => {
    const checkWebEnable = async () => {
      if (Platform.OS === "web") {
        const webPermisse = await CameraView.isAvailableAsync();
        setWebEnable(webPermisse);
      }
    };
    checkWebEnable();
  }, []);

  useEffect(() => {
    const checkPermission = () => {
      if (!permission) {
        return;
      }
      if (permission?.status !== "granted") {
        props?.onScannerError?.({
          type: EScannerError.PermissionError,
          msg: "No camera permission",
        });
      }
    };

    checkPermission();
  }, [permission]);

  useImperativeHandle(ref, () => {
    return {
      startCamera,
      pauseScanner,
      resumeScanner,
      isScannerReady,
    };
  });

  const startCamera = async (): Promise<boolean> => {
    const { status } = await requestPermission();
    const permission = status === "granted";
    scanedRef.current = false;

    return permission;
  };

  const pauseScanner = () => {
    scanedRef.current = true;
  };

  const resumeScanner = () => {
    scanedRef.current = false;
  };

  const isScannerReady = useCallback(() => {
    return isReady;
  }, [isReady]);

  const parseCornerPointsForIOS = (cornerPoints: BarcodePoint[]) => {
    const [leftTop, rightTop, rightBottom, leftBottom] = cornerPoints;
    const width =
      Math.abs(leftBottom.y - leftTop.y) * ScreenHeight * cameraRadio;
    const originRect = {
      x: ScreenWidth - rightBottom.y * ScreenWidth - width,
      y: leftTop.x * ScreenHeight,
      width,
      height: Math.abs(rightTop.x - leftTop.x) * ScreenHeight,
    };
    return originRect;
  };

  const parseCornerPointsForAndorid = (cornerPoints: BarcodePoint[]) => {
    const [leftTop, leftBottom, , rightTop] = cornerPoints;

    const width = Math.abs(leftTop.x - rightTop.x) / cameraRadio;
    const originRect = {
      x: ScreenWidth - leftTop.x - width,
      y: leftTop.y,
      width,
      height: Math.abs(leftBottom.y - leftTop.y),
    };
    return originRect;
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanedRef.current) {
      return;
    }
    // @ts-ignore
    const nativeResult = Platform.OS === 'web' ? result.nativeEvent : result
    // cover orgin react to barcode view rect
    const originRect =
      Platform.OS === "ios"
        ? parseCornerPointsForIOS(nativeResult.cornerPoints)
        : parseCornerPointsForAndorid(nativeResult.cornerPoints);

    if (props?.debugMode) {
      setDebugRect(originRect);
    }
    if (props?.scannerRectangle?.rect) {
      //whether filter this result
      const percentage = calculateOverlapPercentage(
        originRect,
        props?.scannerRectangle?.rect,
      );
      const { ratio = 50 } = props?.scannerRectangle;
      if (percentage < ratio) {
        return;
      }
    }

    props?.onCodeScanned?.(nativeResult.data);

    if (props?.stopWhenScanned) {
      pauseScanner();
    }
  }

  function calculateOverlapPercentage(rect1, rect2) {
    const xOverlap = Math.max(
      0,
      Math.min(rect1.x + rect1.width, rect2.x + rect2.width) -
      Math.max(rect1.x, rect2.x),
    );
    const yOverlap = Math.max(
      0,
      Math.min(rect1.y + rect1.height, rect2.y + rect2.height) -
      Math.max(rect1.y, rect2.y),
    );

    const overlapArea = xOverlap * yOverlap;
    const rect1Area = rect1.width * rect1.height;
    const rect2Area = rect2.width * rect2.height;

    const overlapPercentage =
      (overlapArea / Math.min(rect1Area, rect2Area)) * 100;

    return overlapPercentage;
  }

  const renderCamera = () => {
    if (Platform.OS === "web" && !webEnable) {
      return null;
    }
    return (
      <CameraView
        ref={cameraRef}
        facing={CameraType.back}
        style={StyleSheet.absoluteFillObject}
        onCameraReady={() => {
          setIsReady(true);
        }}
        onMountError={({ message }) => {
          props?.onScannerError?.({
            type: EScannerError.MountError,
            msg: message,
          });
        }}
        {
        ...Platform.select({
          native: {
            onBarcodeScanned: onBarcodeScanned,
            barcodeScannerSettings: {
              barcodeTypes: ["qr"],
              interval: 100, // not working actually
            }
          },
          web: {
            onBarCodeScanned: onBarcodeScanned,
            barCodeScannerSettings: {
              barCodeTypes: ["qr"],
              interval: 100,
            },
            type: CameraType.back
          }
        })
        }
      />
    );
  };

  return (
    <View style={[styles.barcodeWrapper, props?.style]}>
      {renderCamera()}
      {props.debugMode && (
        <>
          {debugRect && (
            <View
              style={[
                styles.debugger,
                {
                  top: debugRect.y,
                  left: debugRect.x,
                  width: debugRect.width,
                  height: debugRect.height,
                  borderColor: 'red',
                },
              ]}
            />
          )}
          {props?.scannerRectangle?.rect && (
            <View
              style={[
                styles.debugger,
                {
                  top: props?.scannerRectangle?.rect.y,
                  left: props?.scannerRectangle?.rect.x,
                  width: props?.scannerRectangle?.rect.width,
                  height: props?.scannerRectangle?.rect.height,
                },
              ]}
            />
          )}
        </>
      )}
    </View>
  );
});

export { QRCodeScanner };

const styles = StyleSheet.create({
  barcodeWrapper: {
    flex: 1,
  },
  debugger: {
    position: "absolute",
    borderWidth: 4,
    borderColor: 'yellow',
  },
});