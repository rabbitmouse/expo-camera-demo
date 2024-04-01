import { useRouter } from "expo-router"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

function HomePage() {

  const router = useRouter()
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={()=>{
        router.navigate('scanner')
      }}>
        <Text style={styles.buttonText}>Goto Scanner</Text>
      </TouchableOpacity>
    </View>
  )
}

export default HomePage

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: 'white', 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'orange',
    height: 36,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  }
})