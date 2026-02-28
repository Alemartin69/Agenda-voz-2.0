import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { getItems, updateItem, deleteItem } from '../utils/storage';
import { scheduleItemAlarms, cancelItemAlarms } from '../utils/alarmManager';

const TIPO_CONFIG = {
  recordatorio: { icon: '🔔', color: '#6c63ff' },
  vencimiento:  { icon: '📅', color: '#ffa502' },
};

function getTodayDayId() {
  // expo-notifications: 1=Dom, 2=Lun, 3=Mar, 4=Mié, 5=Jue, 6=Vie, 7=Sáb
  return new Date().getDay() + 1; // getDay(): 0=Dom→1, 1=Lun→2 ...
}

export default function HomeScreen({ navigation }) {
  const [items, setItems] = useState([]);

  useFocusEffect(useCallback(() => { loadItems(); }, []));

  async function loadItems() {
    const all = await getItems();
    const todayId = getTodayDayId();
    const todayItems = all
      .filter(i => i.schedule?.days?.includes(todayId))
      .sort((a, b) => (a.schedule?.time || '').localeCompare(b.schedule?.time || ''));
    setItems(todayItems);
  }

  async function toggleActive(item) {
    const updated = { ...item, active: !item.active };
    await updateItem(updated);
    if (updated.active) await scheduleItemAlarms(updated);
    else await cancelItemAlarms(updated.id);
    setItems(p => p.map(i => i.id === item.id ? updated : i));
  }

  async function confirmDelete(item) {
    Alert.alert('Eliminar', `¿Eliminar "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await cancelItemAlarms(item.id);
        await deleteItem(item.id);
        setItems(p => p.filter(i => i.id !== item.id));
      }},
    ]);
  }

  const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const today = new Date();
  const dayName = DAY_NAMES[today.getDay()];
  const dateStr = today.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });

  const activos = items.filter(i => i.active).length;

  const renderItem = ({ item }) => {
    const tc = TIPO_CONFIG[item.tipo || 'recordatorio'];
    return (
      <TouchableOpacity
        style={[styles.card, !item.active && styles.cardInactive]}
        onPress={() => navigation.navigate('AddEdit', { item })}
        onLongPress={() => confirmDelete(item)}
        activeOpacity={0.85}
      >
        <View style={[styles.timeBlock, { borderLeftColor: tc.color }]}>
          <Text style={[styles.timeText, { color: tc.color }]}>
            {item.schedule?.time || '--:--'}
          </Text>
          <Text style={styles.tipoIcon}>{tc.icon}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.itemName, !item.active && styles.textMuted]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.metaText}>
            🔄 cada {item.repeatInterval || 5} min
            {(item.audioUri || item.audioFilePath)
              ? '  🎙️ con audio'
              : '  ⚠️ sin audio'}
          </Text>
        </View>

        <Switch
          value={item.active}
          onValueChange={() => toggleActive(item)}
          trackColor={{ false: theme.colors.border, true: tc.color + '88' }}
          thumbColor={item.active ? tc.color : theme.colors.textDim}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header con fecha de hoy */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dayName}>📍 {dayName}</Text>
          <Text style={styles.dateStr}>{dateStr}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Contador */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {items.length === 0
            ? 'Sin recordatorios para hoy'
            : `${activos} activo${activos !== 1 ? 's' : ''} · ${items.length} en total`}
        </Text>
      </View>

      {/* Lista */}
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>¡Sin recordatorios hoy!</Text>
          <Text style={styles.emptyText}>Tocá + para agregar uno</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEdit', { item: null })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>Mantené presionado para eliminar</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  dayName: { color: theme.colors.primary, fontSize: 24, fontWeight: '900' },
  dateStr: { color: theme.colors.textMuted, fontSize: 14, marginTop: 2 },
  settingsBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsIcon: { fontSize: 20 },
  statsBar: {
    paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  statsText: { color: theme.colors.textMuted, fontSize: 13 },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: 14, marginBottom: 10,
    borderWidth: 1, borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  cardInactive: { opacity: 0.45 },
  timeBlock: {
    width: 68, alignSelf: 'stretch',
    alignItems: 'center', justifyContent: 'center',
    borderLeftWidth: 4, paddingVertical: 14,
  },
  timeText: { fontSize: 15, fontWeight: '900' },
  tipoIcon: { fontSize: 18, marginTop: 4 },
  cardBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  itemName: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  metaText: { color: theme.colors.textMuted, fontSize: 12 },
  textMuted: { color: theme.colors.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: theme.colors.textMuted, fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 40, right: 24,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 36, fontWeight: '300' },
  hint: { position: 'absolute', bottom: 16, alignSelf: 'center', color: theme.colors.textDim, fontSize: 11 },
});
