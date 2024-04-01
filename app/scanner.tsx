import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Dimensions, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EScannerError, IQRScannerRef, QRCodeScanner, TScannerError } from "../components/QRCodeScanner";

const ScreenWidth = Dimensions.get('screen').width

export default function FormTest() {
  const safeAreaInsets = useSafeAreaInsets();
  const scannerRef = useRef<IQRScannerRef>(null);
  const router = useRouter();

  const marginH = 50;
  const marginTop = safeAreaInsets.top + 160;
  const cropWitdh = ScreenWidth - 2 * marginH;

  const closeHandle = () => {
    router.back();
  };


  const onScannerError = (error: TScannerError) => {
    Alert.alert('error', error.msg)

    if (error.type === EScannerError.PermissionError) {
      // goto app settings or back to prePage
      // then restart the scanner
      scannerRef?.current?.startCamera?.();
    } else if (error.type === EScannerError.PlatformError) {
      // show alert for user
    } else {
      // expo scanner error
      // report this error and back to prePage
    }
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={closeHandle}>
          <Text>Back</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      <QRCodeScanner
        style={styles.scanner}
        ref={scannerRef}
        stopWhenScanned
        debugMode
        scannerRectangle={{
          rect: {
            x: marginH,
            y: marginTop,
            width: cropWitdh,
            height: cropWitdh,
          },
          ratio: 80,
        }}
        onCodeScanned={(code) => {
          console.log("QRCodeScanner", code);
        }}
        onScannerError={onScannerError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    height: 128,
    paddingBottom: 10,
    width: '100%'
  },
  scanner: {
    width: '100%'
  },
  closeButton: {
    padding: 5,
    backgroundColor: '#fff',
    alignItems: "center",
    justifyContent: "center",
  },
});
