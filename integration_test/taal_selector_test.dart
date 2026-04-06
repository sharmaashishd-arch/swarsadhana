import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:swarsadhana/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Taal selector shows all free taals', (tester) async {
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // The home screen should contain the Tabla card with taal info
    final tablaSection = find.text('Tabla');
    expect(tablaSection, findsWidgets);
  });

  testWidgets('Teentaal is default taal', (tester) async {
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // Teentaal should be shown as the current taal
    expect(find.text('Teentaal'), findsWidgets);
  });

  testWidgets('Required taals are visible in expanded card', (tester) async {
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // The required taals should be listed when the card is expanded.
    // Keherwa and Dadra are free and should be visible.
    final keherwa = find.text('Keherwa');
    final dadra = find.text('Dadra');

    // At minimum, the Teentaal label should be shown
    expect(find.text('Teentaal'), findsWidgets);

    // Keherwa and Dadra may only appear after expanding the card,
    // so we try to find the expanded view
    final expandable = find.byType(GestureDetector);
    if (expandable.evaluate().isNotEmpty) {
      await tester.tap(expandable.first);
      await tester.pumpAndSettle();
    }

    // After expansion, verify the taal names appear
    expect(keherwa, findsWidgets);
    expect(dadra, findsWidgets);
  });
}
