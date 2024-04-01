import { Stack, useNavigationContainerRef, usePathname, useRouter } from "expo-router";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

const screenOptions: NativeStackNavigationOptions = {
  animation: "slide_from_right",
  orientation: "portrait",
  gestureEnabled: true,
  headerShown: false,
  contentStyle: {
    backgroundColor: "#fff",
  },
};

export default function RootLayout() {

  return (
    <Stack
      // https://reactnavigation.org/docs/headers#sharing-common-options-across-screens
      screenOptions={screenOptions}
    >

    </Stack>
  );
}