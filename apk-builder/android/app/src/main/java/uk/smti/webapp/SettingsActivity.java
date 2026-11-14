package uk.smti.webapp;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

/** PIN-protected screen for changing the allowed sites without building a new APK. */
public class SettingsActivity extends Activity {

    private Config config;
    private LinearLayout siteRows;
    private EditText extraInput;
    private EditText pin1;
    private EditText pin2;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        config = new Config(this);
        if (!config.hasPin()) { // never open unprotected
            finish();
            return;
        }

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(Color.parseColor("#F4F6FA"));
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(dp(16), dp(16), dp(16), dp(32));
        scroll.addView(col);

        col.addView(heading("אתרים"));
        col.addView(note("כל אתר מופיע כלחצן במסך הבית. גם תתי-האתרים שלו מותרים."));
        siteRows = new LinearLayout(this);
        siteRows.setOrientation(LinearLayout.VERTICAL);
        col.addView(siteRows);
        for (Config.Site s : config.sites) addSiteRow(s);
        Button add = new Button(this);
        add.setText("+ הוספת אתר");
        add.setOnClickListener(v -> addSiteRow(new Config.Site("", "", false)));
        col.addView(add);

        col.addView(heading("כתובות נוספות מורשות"));
        col.addView(note("לא מופיעות במסך הבית, אבל מותר לעבור אליהן (למשל אתר התחברות). שורה לכל כתובת."));
        extraInput = new EditText(this);
        extraInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE
                | InputType.TYPE_TEXT_VARIATION_URI);
        extraInput.setMinLines(3);
        extraInput.setTextDirection(View.TEXT_DIRECTION_LTR);
        extraInput.setText(android.text.TextUtils.join("\n", config.extraDomains));
        col.addView(card(extraInput));

        col.addView(heading("שינוי קוד"));
        col.addView(note("השאר ריק כדי לא לשנות."));
        pin1 = pinField("קוד חדש");
        pin2 = pinField("שוב את הקוד החדש");
        LinearLayout pins = new LinearLayout(this);
        pins.setOrientation(LinearLayout.VERTICAL);
        pins.addView(pin1);
        pins.addView(pin2);
        col.addView(card(pins));

        Button save = new Button(this);
        save.setText("שמירה");
        save.setOnClickListener(v -> save());
        LinearLayout.LayoutParams lp = full();
        lp.topMargin = dp(20);
        col.addView(save, lp);

        Button reset = new Button(this);
        reset.setText("שחזור הגדרות המקור");
        reset.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setMessage("לחזור לאתרים ולקוד שהיו באפליקציה בהתקנה?")
                .setPositiveButton("כן", (d, w) -> {
                    config.restoreDefaults();
                    setResult(RESULT_OK);
                    finish();
                })
                .setNegativeButton("ביטול", null)
                .show());
        col.addView(reset, full());

        setContentView(scroll);
    }

    private void addSiteRow(Config.Site s) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.VERTICAL);

        EditText title = new EditText(this);
        title.setHint("שם (למשל: שיעורים)");
        title.setSingleLine(true);
        title.setText(s.title);
        row.addView(title);

        EditText url = new EditText(this);
        url.setHint("כתובת (למשל: example.com)");
        url.setSingleLine(true);
        url.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        url.setTextDirection(View.TEXT_DIRECTION_LTR);
        url.setText(s.url);
        row.addView(url);

        CheckBox restrict = new CheckBox(this);
        restrict.setText("רק הנתיב הזה ולא כל האתר");
        restrict.setChecked(s.restrictPath);
        row.addView(restrict);

        Button del = new Button(this);
        del.setText("הסרה");
        del.setTextColor(Color.parseColor("#B3261E"));
        row.addView(del, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        View c = card(row);
        del.setOnClickListener(v -> siteRows.removeView(c));
        row.setTag(new Object[]{title, url, restrict});
        siteRows.addView(c);
    }

    private void save() {
        List<Config.Site> sites = new ArrayList<>();
        for (int i = 0; i < siteRows.getChildCount(); i++) {
            LinearLayout row = (LinearLayout) ((ViewGroup) siteRows.getChildAt(i)).getChildAt(0);
            Object[] f = (Object[]) row.getTag();
            String title = ((EditText) f[0]).getText().toString().trim();
            String rawUrl = ((EditText) f[1]).getText().toString().trim();
            if (rawUrl.isEmpty()) continue;
            String url = Config.normalizeUrl(rawUrl);
            if (url == null) {
                toast("כתובת לא תקינה: " + rawUrl);
                return;
            }
            if (title.isEmpty()) title = Config.hostOf(url);
            sites.add(new Config.Site(title, url, ((CheckBox) f[2]).isChecked()));
        }
        if (sites.isEmpty()) {
            toast("צריך לפחות אתר אחד");
            return;
        }

        List<String> extra = new ArrayList<>();
        for (String line : extraInput.getText().toString().split("[\\n,\\s]+")) {
            line = line.trim();
            if (line.isEmpty()) continue;
            if (Config.normalizeUrl(line) == null) {
                toast("כתובת לא תקינה: " + line);
                return;
            }
            extra.add(line);
        }

        String p1 = pin1.getText().toString();
        String p2 = pin2.getText().toString();
        if (!p1.isEmpty() || !p2.isEmpty()) {
            if (p1.length() < 4) {
                toast("הקוד צריך להיות לפחות 4 ספרות");
                return;
            }
            if (!p1.equals(p2)) {
                toast("הקודים לא תואמים");
                return;
            }
            config.setPin(p1);
        }

        config.save(sites, extra);
        toast("נשמר");
        setResult(RESULT_OK);
        finish();
    }

    // ---------- small view helpers ----------

    private TextView heading(String text) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(18);
        t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setTextColor(Color.parseColor("#1B2430"));
        t.setPadding(0, dp(18), 0, dp(4));
        return t;
    }

    private TextView note(String text) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextColor(Color.parseColor("#6B7686"));
        t.setPadding(0, 0, 0, dp(8));
        return t;
    }

    private EditText pinField(String hint) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_VARIATION_PASSWORD);
        return e;
    }

    private View card(View inner) {
        LinearLayout box = new LinearLayout(this);
        box.setPadding(dp(12), dp(8), dp(12), dp(8));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.WHITE);
        bg.setCornerRadius(dp(10));
        bg.setStroke(dp(1), Color.parseColor("#DDE3EC"));
        box.setBackground(bg);
        box.addView(inner, full());
        LinearLayout.LayoutParams lp = full();
        lp.bottomMargin = dp(10);
        box.setLayoutParams(lp);
        return box;
    }

    private LinearLayout.LayoutParams full() {
        return new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
    }

    private void toast(String s) {
        Toast.makeText(this, s, Toast.LENGTH_SHORT).show();
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
