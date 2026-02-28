import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert } from 'react-native';
import { theme } from '../theme';
import { getSettings, saveSettings } from '../utils/storage';
import { rebuildAllAlarms } from '../utils/alarmManager';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({ defaultRepeatInterval: 5 });
  const [saved, setSaved]       = useState(false);

  useEffect(() => { load(); }, []);
  async function load() { setSettings(await getSettings()); }

  async function save() {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function rebuildAll() {
    Alert.alert('Reconstruir alarmas', '¿Reprogramar todas las alarmas activas?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reconstruir', onPress: async () => { await rebuildAllAlarms(); Alert.alert('Listo', 'Alarmas reprogramadas.'); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Configuración</Text>
        <TouchableOpacity onPress={save} style={[styles.saveBtn, saved && styles.saveBtnOk]}>
          <Text style={styles.saveBtnText}>{saved ? '✓ Guardado' : 'Guardar'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GENERAL</Text>
          <View style={styles.row}>
            <View style={{ flex:1, marginRight:16 }}>
              <Text style={styles.rowTitle}>Repetición por defecto</Text>
              <Text style={styles.rowSub}>Minutos entre repeticiones de alarma</Text>
            </View>
            <TextInput
              style={styles.numInput}
              value={String(settings.defaultRepeatInterval)}
              onChangeText={v => setSettings(p => ({ ...p, defaultRepeatInterval: parseInt(v)||5 }))}
              keyboardType="numeric" maxLength={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MANTENIMIENTO</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={rebuildAll}>
            <Text style={{ fontSize:22 }}>🔄</Text>
            <View style={{ flex:1 }}>
              <Text style={styles.actionTitle}>Reconstruir alarmas</Text>
              <Text style={styles.actionSub}>Usá esto si las alarmas dejaron de funcionar</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACERCA DE</Text>
          <View style={styles.about}>
            <Text style={{ fontSize:40 }}>📅</Text>
            <Text style={styles.appName}>Agenda Voz</Text>
            <Text style={styles.appVersion}>Versión 1.0.0</Text>
            <Text style={styles.appDesc}>Tu agenda personal con recordatorios en tu propia voz.</Text>
          </View>
        </View>
        <View style={{ height:40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:theme.colors.background },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1, borderBottomColor:theme.colors.border },
  backBtn: { padding:8 }, backText: { color:theme.colors.primary, fontSize:15 },
  headerTitle: { color:theme.colors.text, fontSize:18, fontWeight:'700' },
  saveBtn: { backgroundColor:theme.colors.primary, paddingHorizontal:16, paddingVertical:8, borderRadius:20 },
  saveBtnOk: { backgroundColor:theme.colors.success },
  saveBtnText: { color:'#fff', fontWeight:'700' },
  scroll: { flex:1 },
  section: { margin:16, marginBottom:0, backgroundColor:theme.colors.surface, borderRadius:16, padding:16, borderWidth:1, borderColor:theme.colors.border },
  sectionLabel: { color:theme.colors.primary, fontSize:11, fontWeight:'700', letterSpacing:1.5, marginBottom:12 },
  row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:8 },
  rowTitle: { color:theme.colors.text, fontSize:15, fontWeight:'600' },
  rowSub: { color:theme.colors.textMuted, fontSize:12, marginTop:2 },
  numInput: { width:64, backgroundColor:theme.colors.surfaceAlt, borderRadius:10, padding:10, color:theme.colors.text, fontSize:18, textAlign:'center', fontWeight:'700', borderWidth:1, borderColor:theme.colors.border },
  actionBtn: { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:8 },
  actionTitle: { color:theme.colors.text, fontSize:15, fontWeight:'600' },
  actionSub: { color:theme.colors.textMuted, fontSize:12, marginTop:2 },
  about: { alignItems:'center', paddingVertical:8, gap:4 },
  appName: { color:theme.colors.text, fontSize:20, fontWeight:'800' },
  appVersion: { color:theme.colors.textMuted, fontSize:13 },
  appDesc: { color:theme.colors.textMuted, fontSize:12, textAlign:'center', lineHeight:18, marginTop:6 },
});
