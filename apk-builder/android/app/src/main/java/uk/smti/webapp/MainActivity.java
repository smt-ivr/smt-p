package uk.smti.webapp;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.text.InputType;
import android.view.Gravity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {

    private static final int REQ_FILE = 1;
    private static final int REQ_STORAGE = 2;
    private static final int REQ_SETTINGS = 3;

    private static final int MENU_HOME = 1;
    private static final int MENU_RELOAD = 2;
    private static final int MENU_SETTINGS = 3;

    private Config config;
    private FrameLayout root;
    private WebView web;
    private ProgressBar progress;
    private ScrollView home;
    private LinearLayout errorView;
    private TextView errorText;

    private View fullscreenView;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    private ValueCallback<Uri[]> fileCallback;
    private DownloadManager.Request pendingDownload;
    private String pendingDownloadName;

    // ------------------------------------------------------------------ lifecycle

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        config = new Config(this);
        applyOrientation();
        buildUi();
        if (savedInstanceState != null && web.restoreState(savedInstanceState) != null) {
            showWeb();
        } else {
            showStart();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }

    private void applyOrientation() {
        if ("portrait".equals(config.orientation)) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
        } else if ("landscape".equals(config.orientation)) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
    }

    /** One site: open it. Several: show the home screen with a button per site. */
    private void showStart() {
        if (config.sites.size() == 1) {
            open(config.sites.get(0).url);
        } else {
            showHome();
        }
    }

    // ------------------------------------------------------------------ UI

    @SuppressLint("SetJavaScriptEnabled")
    private void buildUi() {
        root = new FrameLayout(this);

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        // Links with target=_blank load in this same view, so they pass the allow check.
        s.setSupportMultipleWindows(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
        web.setDownloadListener(this::onDownload);
        root.addView(web, match());

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setVisibility(View.GONE);
        root.addView(progress, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(4), Gravity.TOP));

        home = new ScrollView(this);
        home.setBackgroundColor(Color.parseColor("#F4F6FA"));
        root.addView(home, match());

        errorView = new LinearLayout(this);
        errorView.setOrientation(LinearLayout.VERTICAL);
        errorView.setGravity(Gravity.CENTER);
        errorView.setPadding(dp(24), dp(24), dp(24), dp(24));
        errorView.setBackgroundColor(Color.WHITE);
        errorText = new TextView(this);
        errorText.setTextSize(18);
        errorText.setGravity(Gravity.CENTER);
        errorView.addView(errorText);
        Button retry = new Button(this);
        retry.setText("נסה שוב");
        retry.setOnClickListener(v -> {
            errorView.setVisibility(View.GONE);
            web.reload();
        });
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(16);
        errorView.addView(retry, lp);
        errorView.setVisibility(View.GONE);
        root.addView(errorView, match());

        setContentView(root);
    }

    private void showHome() {
        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        list.setPadding(dp(16), dp(16), dp(16), dp(16));

        TextView title = new TextView(this);
        title.setText(getString(R.string.app_name));
        title.setTextSize(24);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(8), 0, dp(16));
        list.addView(title);

        if (config.sites.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText(config.hasPin()
                    ? "אין אתרים ברשימה. אפשר להוסיף בתפריט ← הגדרות."
                    : "אין אתרים ברשימה.");
            empty.setGravity(Gravity.CENTER);
            list.addView(empty);
        }

        for (Config.Site site : config.sites) {
            LinearLayout card = new LinearLayout(this);
            card.setOrientation(LinearLayout.VERTICAL);
            card.setPadding(dp(18), dp(14), dp(18), dp(14));
            GradientDrawable bg = new GradientDrawable();
            bg.setColor(Color.WHITE);
            bg.setCornerRadius(dp(12));
            bg.setStroke(dp(1), Color.parseColor("#DDE3EC"));
            card.setBackground(bg);
            card.setClickable(true);
            card.setFocusable(true);

            TextView name = new TextView(this);
            name.setText(site.title);
            name.setTextSize(18);
            name.setTypeface(Typeface.DEFAULT_BOLD);
            name.setTextColor(Color.parseColor("#1B2430"));
            card.addView(name);

            TextView host = new TextView(this);
            host.setText(Config.hostOf(site.url));
            host.setTextColor(Color.parseColor("#6B7686"));
            host.setTextDirection(View.TEXT_DIRECTION_LTR);
            card.addView(host);

            final String url = site.url;
            card.setOnClickListener(v -> open(url));
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.bottomMargin = dp(10);
            list.addView(card, lp);
        }

        home.removeAllViews();
        home.addView(list);
        home.setVisibility(View.VISIBLE);
        errorView.setVisibility(View.GONE);
        progress.setVisibility(View.GONE);
        web.stopLoading();
        web.setVisibility(View.INVISIBLE);
        invalidateOptionsMenu();
    }

    private void showWeb() {
        home.setVisibility(View.GONE);
        web.setVisibility(View.VISIBLE);
        invalidateOptionsMenu();
    }

    private boolean isHomeShown() {
        return home.getVisibility() == View.VISIBLE;
    }

    private void open(String url) {
        showWeb();
        errorView.setVisibility(View.GONE);
        web.clearHistory();
        web.loadUrl(url);
        clearHistoryOnNextPage = true;
    }

    private boolean clearHistoryOnNextPage;

    private void blocked(String url) {
        Toast.makeText(this, "הכתובת לא מורשית באפליקציה", Toast.LENGTH_SHORT).show();
    }

    // ------------------------------------------------------------------ menu

    @Override
    public boolean onPrepareOptionsMenu(Menu menu) {
        menu.clear();
        if (config.sites.size() > 1 && !isHomeShown()) {
            menu.add(0, MENU_HOME, 0, "מסך הבית").setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM);
        }
        if (!isHomeShown()) menu.add(0, MENU_RELOAD, 1, "רענון");
        if (config.hasPin()) menu.add(0, MENU_SETTINGS, 2, "הגדרות");
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case MENU_HOME:
                showHome();
                return true;
            case MENU_RELOAD:
                errorView.setVisibility(View.GONE);
                web.reload();
                return true;
            case MENU_SETTINGS:
                askPin();
                return true;
        }
        return super.onOptionsItemSelected(item);
    }

    private void askPin() {
        long wait = config.lockRemaining();
        if (wait > 0) {
            Toast.makeText(this, "יותר מדי ניסיונות. נסה שוב בעוד " + (wait / 1000 + 1) + " שניות",
                    Toast.LENGTH_LONG).show();
            return;
        }
        EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_VARIATION_PASSWORD);
        input.setGravity(Gravity.CENTER);
        FrameLayout box = new FrameLayout(this);
        box.setPadding(dp(24), dp(8), dp(24), 0);
        box.addView(input);
        new AlertDialog.Builder(this)
                .setTitle("קוד הגדרות")
                .setView(box)
                .setPositiveButton("כניסה", (d, w) -> {
                    if (config.checkPin(input.getText().toString())) {
                        startActivityForResult(new Intent(this, SettingsActivity.class), REQ_SETTINGS);
                    } else {
                        Toast.makeText(this, "קוד שגוי", Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton("ביטול", null)
                .show();
        input.requestFocus();
    }

    // ------------------------------------------------------------------ navigation

    @Override
    public void onBackPressed() {
        if (fullscreenView != null) {
            hideFullscreen();
        } else if (!isHomeShown() && web.canGoBack()) {
            errorView.setVisibility(View.GONE);
            web.goBack();
        } else if (!isHomeShown() && config.sites.size() > 1) {
            showHome();
        } else {
            super.onBackPressed();
        }
    }

    private class Client extends WebViewClient {

        private boolean check(WebView view, String url) {
            if (config.isAllowed(url)) return false;
            blocked(url);
            return true;
        }

        @Override
        @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return check(view, url);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return check(view, request.getUrl().toString());
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            // Catches navigations that skip shouldOverrideUrlLoading (form posts, some redirects).
            if (!config.isAllowed(url)) {
                view.stopLoading();
                blocked(url);
                if (view.canGoBack()) {
                    view.goBack();
                } else if (config.sites.size() > 1) {
                    showHome();
                } else {
                    // Don't reload the start page here: if it redirects elsewhere that would loop.
                    errorText.setText("האתר מפנה לכתובת שאינה ברשימת האתרים המורשים:\n" + Config.hostOf(url));
                    errorView.setVisibility(View.VISIBLE);
                    progress.setVisibility(View.GONE);
                }
                return;
            }
            progress.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            progress.setVisibility(View.GONE);
            if (clearHistoryOnNextPage) {
                view.clearHistory();
                clearHistoryOnNextPage = false;
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (Build.VERSION.SDK_INT >= 23 && request.isForMainFrame()) {
                showError();
            }
        }

        @Override
        @SuppressWarnings("deprecation")
        public void onReceivedError(WebView view, int code, String desc, String failingUrl) {
            if (Build.VERSION.SDK_INT < 23) showError();
        }
    }

    private void showError() {
        errorText.setText("לא ניתן לטעון את הדף.\nבדוק את החיבור לאינטרנט.");
        errorView.setVisibility(View.VISIBLE);
        progress.setVisibility(View.GONE);
    }

    private class Chrome extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int p) {
            progress.setProgress(p);
            if (p >= 100) progress.setVisibility(View.GONE);
        }

        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            if (fullscreenView != null) {
                callback.onCustomViewHidden();
                return;
            }
            fullscreenView = view;
            fullscreenCallback = callback;
            root.addView(view, match());
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
            if (getActionBar() != null) getActionBar().hide();
        }

        @Override
        public void onHideCustomView() {
            hideFullscreen();
        }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                         FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            try {
                Intent i = params.createIntent();
                if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                    i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                }
                startActivityForResult(i, REQ_FILE);
                return true;
            } catch (Exception e) {
                fileCallback = null;
                return false;
            }
        }
    }

    private void hideFullscreen() {
        if (fullscreenView == null) return;
        root.removeView(fullscreenView);
        fullscreenView = null;
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        if (getActionBar() != null) getActionBar().show();
        if (fullscreenCallback != null) fullscreenCallback.onCustomViewHidden();
        fullscreenCallback = null;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_FILE && fileCallback != null) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int n = data.getClipData().getItemCount();
                    result = new Uri[n];
                    for (int k = 0; k < n; k++) result[k] = data.getClipData().getItemAt(k).getUri();
                } else if (data.getData() != null) {
                    result = new Uri[]{data.getData()};
                }
            }
            fileCallback.onReceiveValue(result);
            fileCallback = null;
        } else if (requestCode == REQ_SETTINGS && resultCode == RESULT_OK) {
            // Settings changed: reload them and start again.
            config = new Config(this);
            showStart();
        }
    }

    // ------------------------------------------------------------------ downloads

    private void onDownload(String url, String userAgent, String disposition, String mime, long length) {
        if (!config.isAllowed(url)) {
            blocked(url);
            return;
        }
        if (!url.startsWith("http")) {
            Toast.makeText(this, "לא ניתן להוריד קובץ זה", Toast.LENGTH_SHORT).show();
            return;
        }
        String name = URLUtil.guessFileName(url, disposition, mime);
        DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
        String cookies = CookieManager.getInstance().getCookie(url);
        if (cookies != null) r.addRequestHeader("Cookie", cookies);
        r.addRequestHeader("User-Agent", userAgent);
        r.setTitle(name);
        r.setMimeType(mime);
        r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);

        if (Build.VERSION.SDK_INT >= 23 && Build.VERSION.SDK_INT <= 28
                && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
            pendingDownload = r;
            pendingDownloadName = name;
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_STORAGE);
            return;
        }
        enqueue(r, name);
    }

    private void enqueue(DownloadManager.Request r, String name) {
        try {
            ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(r);
            Toast.makeText(this, "מוריד: " + name, Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, "ההורדה נכשלה", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] perms, int[] results) {
        if (requestCode == REQ_STORAGE && pendingDownload != null) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
                enqueue(pendingDownload, pendingDownloadName);
            } else {
                Toast.makeText(this, "אין הרשאה לשמור קבצים", Toast.LENGTH_SHORT).show();
            }
            pendingDownload = null;
        }
    }

    // ------------------------------------------------------------------ utils

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private static FrameLayout.LayoutParams match() {
        return new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT);
    }
}
